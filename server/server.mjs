import express from "express";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { createServer } from "http";
import { Pool } from "pg";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import authRoutes from "./auth.mjs";

//Initialize the points
const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN, // your React app origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // if you send cookies/auth headers
  })
);
// Authentication route
app.use("/api/auth", authRoutes);
app.use(cookieParser());
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// PostgreSQL connection
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

// Track game rooms and players
const gameRooms = new Map(); // gameId -> { players: Set, playerColors: Map }
// gameId -> {
// players: Set,
// playerColors: Map,
// spectators: Set,
// timers: { white: number, black: number },
// currentTurn: 'white' | 'black',
// timerInterval: NodeJS.Timeout,
// gameStarted: boolean

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
      is_private BOOLEAN DEFAULT false,
      white_time INTEGER,
      black_time INTEGER,
      current_turn VARCHAR(5) DEFAULT 'white',
      timer_started BOOLEAN DEFAULT false,
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
  // Add this to your existing initDb function in server.js
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      bio TEXT DEFAULT '',
      total_games INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      rating INTEGER DEFAULT 1200,
      badge VARCHAR(50) DEFAULT 'beginner',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    is_private = false,
  } = req.body;
  const game_id = uuidv4();

  try {
    await pool.query(
      `INSERT INTO games (game_id, time_control, time_limit, specter_link, is_private)
       VALUES ($1, $2, $3, $4, $5)`,
      [game_id, time_control, time_limit, specter_link, is_private]
    );

    res.json({ success: true, game_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error creating game" });
  }
});

// Add this new endpoint after /createnewgame
app.get("/public-games", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT game_id, time_control, time_limit, created_at, winner
      FROM games 
      WHERE is_private = false AND winner IS NULL 
      ORDER BY created_at DESC
    `);

    // Add player count and availability for each game
    const gamesWithPlayerCount = result.rows.map((game) => {
      const gameRoom = gameRooms.get(game.game_id);
      const playerCount = gameRoom ? gameRoom.players.size : 0;
      const availableSlots = Math.max(0, 2 - playerCount);

      return {
        ...game,
        playerCount,
        availableSlots,
        canJoin: playerCount < 2,
        hasWhite: gameRoom
          ? Array.from(gameRoom.playerColors.values()).includes("white")
          : false,
        hasBlack: gameRoom
          ? Array.from(gameRoom.playerColors.values()).includes("black")
          : false,
      };
    });

    res.json(gamesWithPlayerCount);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET game status
app.get("/game/:gameId/status", async (req, res) => {
  const { gameId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM games WHERE game_id = $1", [
      gameId,
    ]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Game not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

//Admin games view Admin API- fetch all games
app.get("/api/admin/games", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM games");
    res.json({ games: result.rows });
  } catch (err) {
    console.error("Error fetching games:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Admin api - delete all game
app.delete("/api/admin/games/:id", async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // First, delete chat messages
    await client.query("DELETE FROM chat_messages WHERE game_id = $1", [id]);

    // Then, delete the game
    await client.query("DELETE FROM games WHERE game_id = $1", [id]);

    await client.query("COMMIT");
    res.json({
      message: "Game and related chat messages deleted successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting game:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

//bulk delete
app.delete("/api/admin/games", async (req, res) => {
  const { ids } = req.body; // Array of UUIDs
  if (!Array.isArray(ids))
    return res.status(400).json({ error: "Invalid input" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete related messages
    await client.query(
      `DELETE FROM chat_messages WHERE game_id = ANY($1::uuid[])`,
      [ids]
    );

    // Delete games
    await client.query(`DELETE FROM games WHERE game_id = ANY($1::uuid[])`, [
      ids,
    ]);

    await client.query("COMMIT");
    res.json({ message: "Selected games and their messages deleted" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting multiple games:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

//Socket.io connections
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  //Join game handler
  socket.on("joinGame", async ({ gameId, playerId, role = "player" }) => {
    console.log(
      `${role} ${playerId || socket.id} attempting to join game ${gameId}`
    );

    // Leave any previous rooms
    Array.from(socket.rooms).forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Clean up player from previous game rooms first
    gameRooms.forEach((gameRoom, prevGameId) => {
      if (gameRoom.players.has(socket.id) && prevGameId !== gameId) {
        gameRoom.players.delete(socket.id);
        gameRoom.playerColors.delete(socket.id);
        // Remove from spectators if rejoining
        gameRoom.spectators.delete(socket.id);
      }
    });

    //socket.join(gameId);

    // Initialize game room if it doesn't exist
    if (!gameRooms.has(gameId)) {
      gameRooms.set(gameId, {
        players: new Set(),
        playerColors: new Map(),
        spectators: new Set(),
      });
    }

    const gameRoom = gameRooms.get(gameId);

    if (role === "spectator") {
      socket.join(gameId);
      socket.emit("assignRole", "spectator");
      console.log(`Spectator ${socket.id} joined game ${gameId}`);
      gameRoom.spectators.add(socket.id);
    } else {
      // Existing player joining logic
      if (gameRoom.players.size >= 2 && !gameRoom.players.has(socket.id)) {
        socket.emit("roomFull");
        return;
      }

      socket.join(gameId);

      if (!gameRoom.players.has(socket.id)) {
        gameRoom.players.add(socket.id);
      }

      // Existing color assignment logic continues...
      // Assign colors if not already assigned
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

      if (color) {
        console.log("server setting color: " + color);
        gameRoom.playerColors.set(socket.id, color);
        socket.emit("assignColor", color);
      }
      // Initialize timers when second player joins
      if (gameRoom.players.size === 2 && !gameRoom.gameStarted) {
        try {
          const gameResult = await pool.query(
            "SELECT time_limit, white_time, black_time, current_turn, timer_started FROM games WHERE game_id = $1",
            [gameId]
          );

          if (gameResult.rows.length > 0) {
            const {
              time_limit,
              white_time,
              black_time,
              current_turn,
              timer_started,
            } = gameResult.rows[0];
            if (time_limit) {
              const timeInSeconds = time_limit * 60;
              gameRoom.timers = {
                white: white_time !== null ? white_time : timeInSeconds,
                black: black_time !== null ? black_time : timeInSeconds,
              };
              gameRoom.currentTurn = current_turn || "white";
              gameRoom.timerStarted = timer_started || false;
              gameRoom.gameStarted = false;

              // Broadcast current timer state
              io.to(gameId).emit("timerUpdate", {
                whiteTime: gameRoom.timers.white,
                blackTime: gameRoom.timers.black,
                currentTurn: gameRoom.currentTurn,
              });

              // Resume timer if it was already started
              if (gameRoom.timerStarted) {
                startGameTimer(gameId);
              }
            }
          }
        } catch (error) {
          console.error("Error initializing timers:", error);
        }
      }

      console.log(
        `Player ${
          socket.id
        } joined game ${gameId} as ${gameRoom.playerColors.get(socket.id)}`
      );
    }

    // Send existing move history and game status
    try {
      const result = await pool.query(
        "SELECT move_history, winner FROM games WHERE game_id = $1",
        [gameId]
      );
      if (result.rows.length > 0) {
        const gameData = result.rows[0];
        socket.emit("loadMoves", gameData.move_history, {
          winner: gameData.winner,
        });
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
    const spectatorsInRoom = Array.from(gameRoom.spectators);

    io.to(gameId).emit("playerStatus", {
      playersOnline: playersInRoom.length,
      players: playersInRoom,
      spectatorsOnline: spectatorsInRoom.length,
      spectators: spectatorsInRoom,
    });
  });
  //timer and timeup for the players games
  socket.on("timeUp", async ({ gameId, loser }) => {
    try {
      const winner = loser === "white" ? "black" : "white";
      await pool.query("UPDATE games SET winner = $1 WHERE game_id = $2", [
        winner,
        gameId,
      ]);
      io.to(gameId).emit("gameEnded", { winner, reason: "timeout" });
    } catch (error) {
      console.error("Error updating game result:", error);
    }
  });

  // Add undo move request socket events
  socket.on("respondToUndoMove", async ({ gameId, accepted, gameState }) => {
    if (accepted && gameState) {
      try {
        // Get current move history
        const result = await pool.query(
          "SELECT move_history FROM games WHERE game_id = $1",
          [gameId]
        );

        if (result.rows.length > 0) {
          let moveHistory = result.rows[0].move_history || [];

          // Remove the last move if history exists
          if (moveHistory.length > 0) {
            moveHistory.pop();

            // Update the move history in database
            await pool.query(
              "UPDATE games SET move_history = $1 WHERE game_id = $2",
              [JSON.stringify(moveHistory), gameId]
            );

            // Broadcast the undo to all players
            io.to(gameId).emit("moveUndone", {
              newFen: gameState.fen,
              newTurn: gameState.turn,
              removedMove: gameState.lastMove,
            });
          }
        }
      } catch (error) {
        console.error("Error processing undo move:", error);
        socket.emit("undoMoveError", { message: "Failed to undo move" });
      }
    } else {
      // Notify that undo was rejected
      socket.to(gameId).emit("undoMoveRejected");
    }
  });

  //Add draw offer socket event (add this after the existing socket events)
  socket.on("offerDraw", async ({ gameId, offeringPlayer }) => {
    // Broadcast draw offer to opponent
    socket.to(gameId).emit("drawOffer", { offeringPlayer });
  });

  socket.on("respondToDraw", async ({ gameId, accepted }) => {
    if (accepted) {
      try {
        stopGameTimer(gameId);
        await pool.query("UPDATE games SET winner = $1 WHERE game_id = $2", [
          "draw",
          gameId,
        ]);
        io.to(gameId).emit("gameEnded", { winner: "draw" });
      } catch (error) {
        console.error("Error updating game result:", error);
      }
    } else {
      // Notify that draw was rejected
      io.to(gameId).emit("drawRejected");
    }
  });

  //Making moves
  socket.on(
    "moveMade",
    async ({ gameId, move, fen, isCheckmate, winner, currentTurn }) => {
      try {
        const gameRoom = gameRooms.get(gameId);

        // Start timer on first move
        if (gameRoom && !gameRoom.timerStarted && gameRoom.timers) {
          gameRoom.timerStarted = true;
          startGameTimer(gameId);
        }
        // Save timer state to database
        if (gameRoom && gameRoom.timers) {
          await pool.query(
            "UPDATE games SET white_time = $1, black_time = $2, current_turn = $3, timer_started = $4 WHERE game_id = $5",
            [
              gameRoom.timers.white,
              gameRoom.timers.black,
              gameRoom.currentTurn,
              gameRoom.timerStarted,
              gameId,
            ]
          );
        }
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
        // Switch turn for timer
        switchTurn(gameId);

        // Check if game ended due to checkmate
        if (isCheckmate && winner) {
          await pool.query("UPDATE games SET winner = $1 WHERE game_id = $2", [
            winner,
            gameId,
          ]);
          io.to(gameId).emit("gameEnded", { winner, reason: "checkmate" });
        } else {
          // Broadcast move to other players in the room
          socket.to(gameId).emit("opponentMove", { move, fen });
        }
      } catch (error) {
        console.error("Error saving move:", error);
      }
    }
  );

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
      stopGameTimer(gameId);
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
      stopGameTimer(gameId);
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

  // socket.on("timeUp", async ({ gameId, loser }) => {
  //   try {
  //     const winner = loser === "white" ? "black" : "white";
  //     await pool.query("UPDATE games SET winner = $1 WHERE game_id = $2", [
  //       winner,
  //       gameId,
  //     ]);
  //     io.to(gameId).emit("gameEnded", { winner, reason: "timeout" });
  //   } catch (error) {
  //     console.error("Error updating game result:", error);
  //   }
  // });

  socket.on("disconnect", () => {
    console.log("A user disconnected: " + socket.id);

    // Clean up player from all game rooms
    gameRooms.forEach((room, gameId) => {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        room.playerColors.delete(socket.id);
      }

      // Save timer state and stop timer when players disconnect
      if (room.timers && room.players.size > 0) {
        // Save current timer state to database before stopping
        pool
          .query(
            "UPDATE games SET white_time = $1, black_time = $2, current_turn = $3, timer_started = $4 WHERE game_id = $5",
            [
              room.timers.white,
              room.timers.black,
              room.currentTurn,
              room.timerStarted,
              gameId,
            ]
          )
          .catch(console.error);
      }

      stopGameTimer(gameId);

      // Clean up game room if no players left
      if (room.players.size === 0) {
        gameRooms.delete(gameId);
      }

      if (room.spectators.has(socket.id)) {
        room.spectators.delete(socket.id);
      }

      io.to(gameId).emit("playerStatus", {
        playersOnline: room.players.size,
        players: Array.from(room.players),
        spectatorsOnline: room.spectators.size,
        spectators: Array.from(room.spectators),
      });
    });
  });
});

function startGameTimer(gameId) {
  const gameRoom = gameRooms.get(gameId);
  if (!gameRoom || gameRoom.timerInterval || !gameRoom.timerStarted) return;

  gameRoom.timerInterval = setInterval(async () => {
    if (!gameRoom.timers || !gameRoom.timerStarted) return;

    const currentPlayer = gameRoom.currentTurn;
    if (gameRoom.timers[currentPlayer] > 0) {
      gameRoom.timers[currentPlayer]--;

      // Broadcast timer update
      io.to(gameId).emit("timerUpdate", {
        whiteTime: gameRoom.timers.white,
        blackTime: gameRoom.timers.black,
        currentTurn: gameRoom.currentTurn,
      });

      // Save timer state every 10 seconds to reduce database load
      if (gameRoom.timers[currentPlayer] % 10 === 0) {
        try {
          await pool.query(
            "UPDATE games SET white_time = $1, black_time = $2 WHERE game_id = $3",
            [gameRoom.timers.white, gameRoom.timers.black, gameId]
          );
        } catch (error) {
          console.error("Error saving timer state:", error);
        }
      }

      // Check if time ran out
      if (gameRoom.timers[currentPlayer] <= 0) {
        clearInterval(gameRoom.timerInterval);
        const winner = currentPlayer === "white" ? "black" : "white";

        // Update database with final result
        try {
          await pool.query("UPDATE games SET winner = $1 WHERE game_id = $2", [
            winner,
            gameId,
          ]);
          io.to(gameId).emit("gameEnded", { winner, reason: "timeout" });
        } catch (error) {
          console.error("Error updating game result:", error);
        }
      }
    }
  }, 1000);
}

function stopGameTimer(gameId) {
  const gameRoom = gameRooms.get(gameId);
  if (gameRoom && gameRoom.timerInterval) {
    clearInterval(gameRoom.timerInterval);
    gameRoom.timerInterval = null;
  }
}

function switchTurn(gameId) {
  const gameRoom = gameRooms.get(gameId);
  if (gameRoom && gameRoom.timers) {
    gameRoom.currentTurn = gameRoom.currentTurn === "white" ? "black" : "white";

    io.to(gameId).emit("timerUpdate", {
      whiteTime: gameRoom.timers.white,
      blackTime: gameRoom.timers.black,
      currentTurn: gameRoom.currentTurn,
    });
  }
}

//At last server start
server.listen(port, () => {
  console.log(`Server running on ${port}`);
});
