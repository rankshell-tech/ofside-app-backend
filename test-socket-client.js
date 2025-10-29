import { io } from "socket.io-client";

const socket = io("http://localhost:4000"); // your backend server URL

socket.on("connect", () => {
  console.log("✅ Connected to socket:", socket.id);

  // Join a match room
  socket.emit("join_match", { matchId: "6720c1cfd14f", sport: "badminton" });

  // After joining, simulate a score update
  setTimeout(() => {
    socket.emit("match_event", {
      matchId: "6720c1cfd14f",
      sport: "badminton",
      type: "point_scored",
      payload: { team: 1, points: 1 },
    });
  }, 2000);
});

socket.on("match_updated", (data) => {
  console.log("📡 Received match update:", data);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});
