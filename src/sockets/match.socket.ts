import { Server, Socket } from "socket.io";
import { getMatchModel } from "../utils/matchModelResolver";
import { generateCommentary } from "../services/aiCommentaryService";
import jwt from "jsonwebtoken";

/**
 * Register all match-related websocket logic
 * Handles real-time updates for multiple sports
 */
export default function registerMatchSocket(io: Server) {


   // 🔒 AUTHENTICATION MIDDLEWARE
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token; // token sent from frontend

    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET as string);
      socket.data.user = user; // Attach user info to socket
      next(); // Allow connection
    } catch (err) {
      console.error("JWT verification failed:", err);
      next(new Error("Invalid token"));
    }
  });



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
    const user = socket.data.user;

    if (!user) {
      return socket.emit("error", "Unauthorized: no user found");
    }

    const Model = getMatchModel(sport);
    const match = await Model.findById(matchId);
    if (!match) return;

    // ✅ Check if user is allowed to update this match
    const isAuthorized = match.scoringUpdatedBy.some(
      (id: any) => id.toString() === user._id
    );

    if (!isAuthorized) {
      return socket.emit("error", "You are not allowed to update this match");
    }

    // ⚡ Continue updating the match
    switch (sport) {
      case "football":
        handleFootballEvent(match, type, payload);
        break;
      case "basketball":
        handleBasketballEvent(match, type, payload);
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
        
    }

    await match.save();

    const commentary = await generateCommentary({
      sport,
      event: { type, payload },
      match,
    });

    io.to(matchId).emit("match_updated", {
      type,
      sport,
      match,
      commentary,
    });

  } catch (err) {
    console.error("match_event error:", err);
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


// https://chatgpt.com/share/6903666e-eb84-8004-8fce-5f8dcfc34841