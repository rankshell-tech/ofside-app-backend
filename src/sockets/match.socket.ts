// src/sockets/match.socket.ts
import { Server, Socket } from "socket.io";
import { getMatchModel } from "../utils/matchModelResolver";

export default function registerMatchSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`🟢 ${socket.id} connected`);

    // Join specific match room
    socket.on("join_match", ({ matchId, sport }) => {
      socket.join(matchId);
      console.log(`Client ${socket.id} joined ${sport} match ${matchId}`);
    });

    // Generic score update event
    socket.on("update_score", async ({ matchId, sport, payload }) => {
      try {
        const Model = getMatchModel(sport);
        const match = await Model.findById(matchId);
        if (!match) return;

        // Handle sport-specific scoring logic dynamically
        if (sport === "basketball") {
          const { teamId, points, playerId, quarter } = payload;
          match.totalScore[teamId === match.teams[0]._id ? "team1" : "team2"] += points;
          match.scoreEvents.push({
            teamId,
            points,
            playerId,
            quarter,
            time: new Date().toISOString(),
          });
        } else if (sport === "badminton") {
          const { team, points } = payload;
          const currentGame = match.games[match.currentGame - 1];
          if (team === 1) currentGame.team1Points += points;
          else currentGame.team2Points += points;
        }

        await match.save();

        // Broadcast updated match to all clients in this match room
        io.to(matchId).emit("match_updated", match);
      } catch (err) {
        console.error("❌ Error in update_score:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔴 ${socket.id} disconnected`);
    });
  });
}
