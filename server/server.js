const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const games = {}; // { gameId: { moves: [], fen: null } }
// Now store arrays of socket IDs per color
const gamePlayers = {}; // { gameId: { white: [], black: [] } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinGame", (gameId) => {
    console.log(`Socket ${socket.id} joining game ${gameId}`);

    if (!gamePlayers[gameId]) {
      gamePlayers[gameId] = { white: [], black: [] };
    }

    const players = gamePlayers[gameId];

    // If already joined (possible reconnect or multiple tabs)
    if (players.white.includes(socket.id)) {
      socket.emit("assignColor", "white");
      socket.join(gameId);
      socket.emit("gameState", games[gameId] || { moves: [], fen: null });
      return;
    }
    if (players.black.includes(socket.id)) {
      socket.emit("assignColor", "black");
      socket.join(gameId);
      socket.emit("gameState", games[gameId] || { moves: [], fen: null });
      return;
    }

    // Assign color - balance connections by count or any logic you want
    let assignedColor = null;
    if (players.white.length <= players.black.length) {
      players.white.push(socket.id);
      assignedColor = "white";
    } else {
      players.black.push(socket.id);
      assignedColor = "black";
    }

    socket.join(gameId);
    socket.emit("assignColor", assignedColor);

    if (!games[gameId]) {
      games[gameId] = { moves: [], fen: null };
    }
    socket.emit("gameState", games[gameId]);

    // Notify other players about the new connection
    socket.to(gameId).emit("playerStatus", {
      playerId: socket.id,
      status: "online",
      color: assignedColor,
    });

    // Optionally notify this socket about other players already connected
    [...players.white, ...players.black]
      .filter((id) => id !== socket.id)
      .forEach((id) => {
        socket.emit("playerStatus", {
          playerId: id,
          status: "online",
          color: players.white.includes(id) ? "white" : "black",
        });
      });
  });

  socket.on("moveMade", ({ gameId, fen, move }) => {
    if (!games[gameId]) {
      games[gameId] = { moves: [], fen: null };
    }
    games[gameId].moves.push(move);
    games[gameId].fen = fen;
    socket.to(gameId).emit("opponentMove", { fen, move });
  });

  socket.on("chatMessage", ({ gameId, user, text }) => {
    io.to(gameId).emit("chatMessage", { user, text });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const [gameId, players] of Object.entries(gamePlayers)) {
      let removedColor = null;
      if (players.white.includes(socket.id)) {
        players.white = players.white.filter((id) => id !== socket.id);
        removedColor = "white";
      } else if (players.black.includes(socket.id)) {
        players.black = players.black.filter((id) => id !== socket.id);
        removedColor = "black";
      }
      if (removedColor) {
        io.to(gameId).emit("playerStatus", {
          playerId: socket.id,
          status: "offline",
          color: removedColor,
        });
      }
    }
  });
});

server.listen(3001, () => {
  console.log("Socket.IO server running on port 3001");
});
