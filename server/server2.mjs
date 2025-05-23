import express from "express";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { createServer } from "http";
import { Pool } from "pg";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

//Initialize the points
const app = express();
const port = 3001;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000", // your React app origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // if you send cookies/auth headers
  })
);
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "testknight",
  password: "root",
  port: 5432,
});

// Track game rooms and players
const gameRooms = new Map(); // gameId -> { players: Set, playerColors: Map }

// Initialize table if it doesn't exist
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS games (
      game_id UUID PRIMARY KEY,
      time_control VARCHAR(50) DEFAULT 'unlimited',
      time_limit INTEGER,
      specter_link TEXT,
      move_history JSONB DEFAULT '[]',
      winner VARCHAR(10) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS moves (
      id SERIAL PRIMARY KEY,
      game_id UUID REFERENCES games(game_id),
      move_number INTEGER,
      move TEXT,
      fen TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      game_id UUID REFERENCES games(game_id),
      sender TEXT,
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
initDb();

//Create a function for Post request for createnewgame;
// POST /createnewgame
app.post("/createnewgame", async (req, res) => {
  const {
    time_control = "unlimited",
    time_limit = null,
    specter_link = null,
  } = req.body;
  const game_id = uuidv4();

  try {
    await pool.query(
      `INSERT INTO games (game_id, time_control, time_limit, specter_link)
       VALUES ($1, $2, $3, $4)`,
      [game_id, time_control, time_limit, specter_link]
    );

    res.json({ success: true, game_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error creating game" });
  }
});

//Socket.io connections
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  socket.on("joinGame", async ({ gameId, playerId }) => {
    console.log(
      `Player ${playerId || socket.id} attempting to join game ${gameId}`
    );

    // Leave any previous rooms
    Array.from(socket.rooms).forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    socket.join(gameId);

    // Initialize game room if it doesn't exist
    if (!gameRooms.has(gameId)) {
      gameRooms.set(gameId, {
        players: new Set(),
        playerColors: new Map(),
      });
    }

    const gameRoom = gameRooms.get(gameId);
    gameRoom.players.add(socket.id);

    // Assign colors if not already assigned
    if (!gameRoom.playerColors.has(socket.id)) {
      const assignedColors = Array.from(gameRoom.playerColors.values());
      let color;

      if (!assignedColors.includes("white")) {
        color = "white";
      } else if (!assignedColors.includes("black")) {
        color = "black";
      } else {
        socket.emit("roomFull");
        return;
      }

      gameRoom.playerColors.set(socket.id, color);
      socket.emit("assignColor", color);
    }

    console.log(
      `Player ${socket.id} joined game ${gameId} as ${gameRoom.playerColors.get(
        socket.id
      )}`
    );

    // Send existing move history
    try {
      const result = await pool.query(
        "SELECT move_history FROM games WHERE game_id = $1",
        [gameId]
      );
      if (result.rows.length > 0) {
        socket.emit("loadMoves", result.rows[0].move_history);
      }
    } catch (error) {
      console.error("Error loading moves:", error);
    }

    // Send existing chat messages
    try {
      const chatResult = await pool.query(
        "SELECT sender, message, created_at FROM chat_messages WHERE game_id = $1 ORDER BY created_at ASC",
        [gameId]
      );
      socket.emit("loadChat", chatResult.rows);
    } catch (error) {
      console.error("Error loading chat:", error);
    }

    // Notify all players in the room about player status
    const playersInRoom = Array.from(gameRoom.players);
    io.to(gameId).emit("playerStatus", {
      playersOnline: playersInRoom.length,
      players: playersInRoom,
    });
  });

  socket.on("moveMade", async ({ gameId, move, fen }) => {
    try {
      // Fetch and parse existing history
      const gameResult = await pool.query(
        "SELECT move_history FROM games WHERE game_id = $1",
        [gameId]
      );

      if (gameResult.rows.length > 0) {
        const moveHistory = gameResult.rows[0].move_history || [];
        moveHistory.push({ move, fen });

        await pool.query(
          "UPDATE games SET move_history = $1 WHERE game_id = $2",
          [JSON.stringify(moveHistory), gameId]
        );
      }

      // Broadcast move to other players in the room
      socket.to(gameId).emit("opponentMove", { move, fen });
    } catch (error) {
      console.error("Error saving move:", error);
    }
  });

  socket.on("chatMessage", async ({ gameId, user, text }) => {
    try {
      await pool.query(
        "INSERT INTO chat_messages (game_id, sender, message) VALUES ($1, $2, $3)",
        [gameId, user, text]
      );
      // Broadcast to all players in the game room
      io.to(gameId).emit("chatMessage", { user, text });
    } catch (err) {
      console.error("DB insert error:", err);
    }
  });

  socket.on("drawGame", async ({ gameId }) => {
    try {
      await pool.query("UPDATE games SET winner = $1 WHERE game_id = $2", [
        "draw",
        gameId,
      ]);
      io.to(gameId).emit("gameEnded", { winner: "draw" });
    } catch (error) {
      console.error("Error updating game result:", error);
    }
  });

  socket.on("surrenderGame", async ({ gameId, loser }) => {
    try {
      const winner = loser === "white" ? "black" : "white";
      await pool.query("UPDATE games SET winner = $1 WHERE game_id = $2", [
        winner,
        gameId,
      ]);
      io.to(gameId).emit("gameEnded", { winner });
    } catch (error) {
      console.error("Error updating game result:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected: " + socket.id);

    // Clean up player from all game rooms
    gameRooms.forEach((gameRoom, gameId) => {
      if (gameRoom.players.has(socket.id)) {
        gameRoom.players.delete(socket.id);
        gameRoom.playerColors.delete(socket.id);

        // Notify remaining players about status change
        const playersInRoom = Array.from(gameRoom.players);
        io.to(gameId).emit("playerStatus", {
          playersOnline: playersInRoom.length,
          players: playersInRoom,
        });

        // Clean up empty rooms
        if (gameRoom.players.size === 0) {
          gameRooms.delete(gameId);
        }
      }
    });
  });
});

//At last server start
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
