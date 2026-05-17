const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

// In-memory room state.
// This is intentionally simple for a school prototype.
// If the server restarts, rooms are cleared.
const rooms = {};

function createRoomCode() {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 6).toUpperCase();
  } while (rooms[code]);
  return code;
}

function calculateDominance(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const participants = Object.values(room.participants);
  const totalSpeakingSeconds = participants.reduce(
    (sum, participant) => sum + participant.speakingSeconds,
    0
  );

  participants.forEach((participant) => {
    participant.percentage =
      totalSpeakingSeconds > 0
        ? Math.round((participant.speakingSeconds / totalSpeakingSeconds) * 100)
        : 0;

    let level = 0;

    if (participant.percentage >= 90) level = 4;
    else if (participant.percentage >= 80) level = 3;
    else if (participant.percentage >= 70) level = 2;
    else if (participant.percentage >= 60) level = 1;

    participant.reactionLevel = level;
  });

  // Send full dashboard state to host only.
  if (room.hostSocketId) {
    io.to(room.hostSocketId).emit("dashboard-update", participants);
  }

  // Send private reaction only to the relevant participant phone.
  participants.forEach((participant) => {
    io.to(participant.socketId).emit("reaction", {
      level: participant.reactionLevel,
      percentage: participant.percentage
    });
  });
}

io.on("connection", (socket) => {
  socket.on("create-room", () => {
    const roomCode = createRoomCode();

    rooms[roomCode] = {
      hostSocketId: socket.id,
      participants: {}
    };

    socket.join(roomCode);
    socket.emit("room-created", roomCode);
  });

  socket.on("join-room", ({ roomCode, name }) => {
    const cleanRoomCode = String(roomCode || "").trim().toUpperCase();
    const cleanName = String(name || "").trim().slice(0, 30);

    const room = rooms[cleanRoomCode];

    if (!room) {
      socket.emit("join-error", "Room not found. Check the host room code.");
      return;
    }

    if (!cleanName) {
      socket.emit("join-error", "Please enter a name.");
      return;
    }

    room.participants[socket.id] = {
      socketId: socket.id,
      name: cleanName,
      speakingSeconds: 0,
      percentage: 0,
      reactionLevel: 0,
      isSpeaking: false,
      lastSignalAt: Date.now()
    };

    socket.join(cleanRoomCode);
    socket.emit("joined-room", cleanRoomCode);

    calculateDominance(cleanRoomCode);
  });

  socket.on("speaking-signal", ({ roomCode, isSpeaking }) => {
    const cleanRoomCode = String(roomCode || "").trim().toUpperCase();
    const room = rooms[cleanRoomCode];
    if (!room) return;

    const participant = room.participants[socket.id];
    if (!participant) return;

    participant.isSpeaking = Boolean(isSpeaking);
    participant.lastSignalAt = Date.now();

    // The browser sends this once per second.
    // If the phone thinks the person is speaking, add one second.
    if (participant.isSpeaking) {
      participant.speakingSeconds += 1;
    }

    calculateDominance(cleanRoomCode);
  });

  socket.on("reset-room", ({ roomCode }) => {
    const cleanRoomCode = String(roomCode || "").trim().toUpperCase();
    const room = rooms[cleanRoomCode];
    if (!room) return;
    if (room.hostSocketId !== socket.id) return;

    Object.values(room.participants).forEach((participant) => {
      participant.speakingSeconds = 0;
      participant.percentage = 0;
      participant.reactionLevel = 0;
      participant.isSpeaking = false;
    });

    calculateDominance(cleanRoomCode);
  });

  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];

      if (room.hostSocketId === socket.id) {
        io.to(roomCode).emit("room-closed");
        delete rooms[roomCode];
        return;
      }

      if (room.participants[socket.id]) {
        delete room.participants[socket.id];
        calculateDominance(roomCode);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`The Mind Reader Interface is running on port ${PORT}`);
});
