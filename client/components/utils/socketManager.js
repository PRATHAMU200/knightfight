// utils/socketManager.js
import { io } from "socket.io-client";

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentGameId = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to server:", this.socket.id);
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentGameId = null;
      this.listeners.clear();
    }
  }

  joinGame(gameId, playerId = null) {
    if (!this.socket) {
      this.connect();
    }

    // Leave previous game if any
    if (this.currentGameId && this.currentGameId !== gameId) {
      this.leaveGame();
    }

    this.currentGameId = gameId;
    this.socket.emit("joinGame", {
      gameId,
      playerId: playerId || this.socket.id,
    });
  }

  leaveGame() {
    if (this.socket && this.currentGameId) {
      this.socket.emit("leaveGame", { gameId: this.currentGameId });
      this.currentGameId = null;
      this.removeAllListeners();
    }
  }

  // Generic event listener management
  on(event, callback, key = null) {
    if (!this.socket) {
      this.connect();
    }

    // Remove existing listener if key is provided
    if (key && this.listeners.has(key)) {
      this.socket.off(event, this.listeners.get(key));
    }

    this.socket.on(event, callback);

    if (key) {
      this.listeners.set(key, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.listeners.forEach((callback, key) => {
        this.socket.off(key, callback);
      });
      this.listeners.clear();
    }
  }

  // Chess-specific methods
  makeMove(gameId, move, fen, isGameEnd = false, winner = null) {
    this.emit("moveMade", {
      gameId,
      move,
      fen,
      isCheckmate: isGameEnd && winner !== "draw",
      winner,
    });
  }

  sendChatMessage(gameId, user, text) {
    this.emit("chatMessage", { gameId, user, text });
  }

  drawGame(gameId) {
    this.emit("drawGame", { gameId });
  }

  surrenderGame(gameId, loser) {
    this.emit("surrenderGame", { gameId, loser });
  }

  // Get singleton instance
  static getInstance() {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }
}

export default SocketManager.getInstance();
