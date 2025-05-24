// utils/socketManager.js
import { io } from "socket.io-client";
const serveruri = process.env.NEXT_PUBLIC_SERVER_API_URL;
class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentGameId = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket) {
      if (this.isConnected) {
        console.log("Already connected");
        return this.socket;
      }

      if (this.socket.connected === false) {
        console.log("Connection in progress");
        return this.socket;
      }
    }

    this.socket = io(serveruri, {
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

  joinGame(gameId, playerId = null, role = "player") {
    if (!this.socket) this.connect();

    if (this.currentGameId === gameId && this.currentRole === role) {
      console.log("Already joined as", role);
      return;
    }

    if (this.currentGameId && this.currentGameId !== gameId) {
      this.leaveGame();
    }

    this.currentGameId = gameId;
    this.currentRole = role;

    const id = playerId || this.socket.id;

    console.log(`Joining game ${gameId} as ${role}: ${id}`);
    this.socket.emit("joinGame", { gameId, playerId: id, role });
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
  makeMove(gameId, move, fen, isGameEnd = false, winner = null, currentTurn) {
    this.emit("moveMade", {
      gameId,
      move,
      fen,
      isCheckmate: isGameEnd && winner !== "draw",
      winner,
      currentTurn,
    });
  }

  // Add timer-specific methods
  onTimerUpdate(callback, key = "timerUpdate") {
    this.on("timerUpdate", callback, key);
  }

  onGameEnded(callback, key = "gameEnded") {
    this.on("gameEnded", callback, key);
  }

  // Method to handle time up (if needed for client-side validation)
  timeUp(gameId, loser) {
    this.emit("timeUp", { gameId, loser });
  }

  sendChatMessage(gameId, user, text) {
    this.emit("chatMessage", { gameId, user, text });
  }

  requestUndoMove(gameId, requestingPlayer) {
    this.emit("requestUndoMove", { gameId, requestingPlayer });
  }

  respondToUndoMove(gameId, accepted, gameState = null) {
    this.emit("respondToUndoMove", { gameId, accepted, gameState });
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
