import { Server, Socket } from "socket.io";
import { getMatchModel } from "../utils/matchModelResolver";

/**
 * Register all match-related websocket logic
 * Handles real-time updates for multiple sports
 */
export default function registerMatchSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`🟢 ${socket.id} connected`);

    /* ------------------------------- JOIN ROOM ------------------------------- */
    socket.on("join_match", ({ matchId, sport }) => {
      socket.join(matchId);
      console.log(`👥 ${socket.id} joined ${sport} match ${matchId}`);
    });

    /* --------------------------- GENERIC EVENT UPDATE --------------------------- */
    socket.on("match_event", async ({ matchId, sport, type, payload }) => {
      try {
        const Model = getMatchModel(sport);
        const match = await Model.findById(matchId);
        if (!match) return;

        switch (sport) {
          case "basketball":
            handleBasketballEvent(match, type, payload);
            break;
          case "football":
            handleFootballEvent(match, type, payload);
            break;
          case "badminton":
            handleBadmintonEvent(match, type, payload);
            break;
          case "tennis":
            handleTennisEvent(match, type, payload);
            break;
          case "volleyball":
            handleVolleyballEvent(match, type, payload);
            break;
          case "pickleball":
            handlePickleballEvent(match, type, payload);
            break;
          default:
            console.warn(`⚠️ Unknown sport: ${sport}`);
        }

        await match.save();

        io.to(matchId).emit("match_updated", {
          type,
          sport,
          match,
        });
      } catch (err) {
        console.error(`❌ [${sport}] match_event error:`, err);
      }
    });

    /* ------------------------------- DISCONNECT ------------------------------- */
    socket.on("disconnect", () => {
      console.log(`🔴 ${socket.id} disconnected`);
    });
  });
}

/* -------------------------------------------------------------------------- */
/*                            SPORT EVENT HANDLERS                            */
/* -------------------------------------------------------------------------- */

// 🏀 Basketball
function handleBasketballEvent(match: any, type: string, payload: any) {
  const { teamId, points, playerId, quarter, description } = payload;
  const teamKey = teamId.equals(match.teams[0]._id) ? "team1" : "team2";

  if (["1_pointer", "2_pointer", "3_pointer"].includes(type)) {
    const pts = type === "1_pointer" ? 1 : type === "2_pointer" ? 2 : 3;
    match.totalScore[teamKey] += pts;
    match.scoreEvents.push({
      teamId,
      points: pts,
      playerId,
      quarter,
      description,
      time: new Date().toISOString(),
    });
  } else if (type === "foul") {
    match.fouls.push({ playerId, teamId, quarter, count: 1 });
  } else if (type === "timeout") {
    match.timeouts.push({ teamId, quarter, minute: payload.minute });
  }
}

// ⚽ Football
function handleFootballEvent(match: any, type: string, payload: any) {
  const { teamId, minute, playerId, assistId, reason } = payload;
  const teamKey = teamId.equals(match.teams[0]._id) ? "team1" : "team2";

  switch (type) {
    case "goal":
    case "own_goal":
    case "penalty":
      match.score[teamKey] += 1;
      match.goals.push({
        teamId,
        minute,
        type,
        scorer: playerId,
        assist: assistId,
      });
      break;
    case "yellow_card":
      match.yellowCards.push({ teamId, playerId, minute, reason });
      break;
    case "red_card":
      match.redCards.push({ teamId, playerId, minute, reason });
      break;
    case "substitution":
      match.substitutions.push(payload);
      break;
  }
}

// 🏸 Badminton
function handleBadmintonEvent(match: any, type: string, payload: any) {
  const { team, points } = payload;
  const currentGame = match.games[match.currentGame - 1];
  if (!currentGame) return;

  if (type === "point_scored") {
    if (team === 1) currentGame.team1Points += points;
    else currentGame.team2Points += points;
  }
}

// 🎾 Tennis
function handleTennisEvent(match: any, type: string, payload: any) {
  const { playerId, eventType, pointTo } = payload;
  const currentGame = match.games[match.currentGame - 1];
  if (!currentGame) return;

  const rallyEvent = {
    playerId,
    eventType,
    pointTo,
    time: new Date().toISOString(),
  };

  currentGame.rallyLog.push(rallyEvent);

  if (pointTo === 1) currentGame.team1Points += 1;
  else if (pointTo === 2) currentGame.team2Points += 1;
}

// 🏐 Volleyball
function handleVolleyballEvent(match: any, type: string, payload: any) {
  const { playerId, eventType, pointTo } = payload;
  const currentGame = match.games[match.currentGame - 1];
  if (!currentGame) return;

  const rallyEvent = {
    playerId,
    eventType,
    pointTo,
    time: new Date().toISOString(),
  };

  currentGame.rallyLog.push(rallyEvent);

  if (pointTo === 1) currentGame.team1Points += 1;
  else if (pointTo === 2) currentGame.team2Points += 1;
}

// 🥒 Pickleball
function handlePickleballEvent(match: any, type: string, payload: any) {
  const { playerId, eventType, pointTo } = payload;
  const currentGame = match.games[match.currentGame - 1];
  if (!currentGame) return;

  const rallyEvent = {
    playerId,
    eventType,
    pointTo,
    time: new Date().toISOString(),
  };

  currentGame.rallyLog.push(rallyEvent);

  if (pointTo === 1) currentGame.team1Points += 1;
  else if (pointTo === 2) currentGame.team2Points += 1;
}
