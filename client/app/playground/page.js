"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import {
  Settings,
  RotateCcw,
  RefreshCw,
  Cpu,
  Shuffle,
  Palette,
  ArrowLeft,
} from "lucide-react";

const BOARD_STYLES = {
  classic: {
    name: "Classic",
    lightSquareStyle: { backgroundColor: "#f0d9b5" },
    darkSquareStyle: { backgroundColor: "#b58863" },
  },
  modern: {
    name: "Modern",
    lightSquareStyle: { backgroundColor: "#eeeed2" },
    darkSquareStyle: { backgroundColor: "#769656" },
  },
  blue: {
    name: "Ocean Blue",
    lightSquareStyle: { backgroundColor: "#dee3e6" },
    darkSquareStyle: { backgroundColor: "#8ca2ad" },
  },
  purple: {
    name: "Royal Purple",
    lightSquareStyle: { backgroundColor: "#f0d0ff" },
    darkSquareStyle: { backgroundColor: "#9f5f9f" },
  },
  dark: {
    name: "Dark Mode",
    lightSquareStyle: { backgroundColor: "#4a4a4a" },
    darkSquareStyle: { backgroundColor: "#2d2d2d" },
  },
  neon: {
    name: "Neon",
    lightSquareStyle: {
      backgroundColor: "#00ff41",
      boxShadow: "0 0 10px rgba(0,255,65,0.3)",
    },
    darkSquareStyle: {
      backgroundColor: "#003d0f",
      boxShadow: "0 0 10px rgba(0,255,65,0.1)",
    },
  },
};

const PIECE_STYLES = {
  classic: "classic",
  modern: "modern",
  three3d: "3d",
};

export default function PlaygroundPage() {
  const chess = useRef(new Chess());
  const [fen, setFen] = useState(chess.current.fen());
  const [gameMode, setGameMode] = useState("ai"); // "ai" or "random"
  const [aiDifficulty, setAiDifficulty] = useState("medium"); // "easy", "medium", "hard"
  const [playerColor, setPlayerColor] = useState("white");
  const [gameStatus, setGameStatus] = useState("playing"); // "playing", "checkmate", "stalemate", "draw"
  const [winner, setWinner] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [boardStyle, setBoardStyle] = useState("classic");
  const [pieceStyle, setPieceStyle] = useState("classic");
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [gameStats, setGameStats] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
  });

  // AI Move calculation
  const makeAIMove = () => {
    if (chess.current.isGameOver() || thinking) return;

    setThinking(true);

    // Simulate thinking time based on difficulty
    const thinkingTime =
      aiDifficulty === "easy" ? 500 : aiDifficulty === "medium" ? 1000 : 1500;

    setTimeout(() => {
      const possibleMoves = chess.current.moves();
      if (possibleMoves.length === 0) {
        setThinking(false);
        return;
      }

      let selectedMove;

      if (gameMode === "random") {
        // Random move
        selectedMove =
          possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      } else {
        // AI move based on difficulty
        selectedMove = getAIMove(possibleMoves, aiDifficulty);
      }

      const move = chess.current.move(selectedMove);
      if (move) {
        setFen(chess.current.fen());
        setMoveHistory((prev) => [...prev, move.san]);
        checkGameStatus();
      }
      setThinking(false);
    }, thinkingTime);
  };

  const getAIMove = (possibleMoves, difficulty) => {
    switch (difficulty) {
      case "easy":
        // 70% random, 30% best move
        if (Math.random() < 0.7) {
          return possibleMoves[
            Math.floor(Math.random() * possibleMoves.length)
          ];
        }
        return getBestMove(possibleMoves);

      case "medium":
        // 40% random, 60% best move
        if (Math.random() < 0.4) {
          return possibleMoves[
            Math.floor(Math.random() * possibleMoves.length)
          ];
        }
        return getBestMove(possibleMoves);

      case "hard":
        // 10% random, 90% best move
        if (Math.random() < 0.1) {
          return possibleMoves[
            Math.floor(Math.random() * possibleMoves.length)
          ];
        }
        return getBestMove(possibleMoves);

      default:
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }
  };

  const getBestMove = (possibleMoves) => {
    // Simple AI logic: prioritize captures, checks, and center control
    const captureBonus = 10;
    const checkBonus = 8;
    const centerBonus = 3;
    const centerSquares = ["d4", "d5", "e4", "e5"];

    let bestMove = possibleMoves[0];
    let bestScore = -1000;

    for (const move of possibleMoves) {
      let score = Math.random() * 2; // Add some randomness

      const moveObj = chess.current.move(move);

      // Check if move is a capture
      if (moveObj.captured) {
        score += captureBonus;
      }

      // Check if move gives check
      if (chess.current.isCheck()) {
        score += checkBonus;
      }

      // Check if move controls center
      if (centerSquares.includes(moveObj.to)) {
        score += centerBonus;
      }

      chess.current.undo(); // Undo the test move

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  };

  const checkGameStatus = () => {
    if (chess.current.isCheckmate()) {
      const winner = chess.current.turn() === "w" ? "black" : "white";
      setGameStatus("checkmate");
      setWinner(winner);
      updateStats(winner === playerColor ? "win" : "loss");
    } else if (chess.current.isStalemate() || chess.current.isDraw()) {
      setGameStatus("draw");
      setWinner("draw");
      updateStats("draw");
    }
  };

  const updateStats = (result) => {
    setGameStats((prev) => ({
      ...prev,
      wins: result === "win" ? prev.wins + 1 : prev.wins,
      losses: result === "loss" ? prev.losses + 1 : prev.losses,
      draws: result === "draw" ? prev.draws + 1 : prev.draws,
    }));
  };

  const onDrop = (sourceSquare, targetSquare) => {
    if (thinking || gameStatus !== "playing") return false;

    // Check if it's player's turn
    const isPlayerTurn =
      (chess.current.turn() === "w" && playerColor === "white") ||
      (chess.current.turn() === "b" && playerColor === "black");

    if (!isPlayerTurn) return false;

    const move = chess.current.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (move === null) return false;

    setFen(chess.current.fen());
    setMoveHistory((prev) => [...prev, move.san]);
    checkGameStatus();

    // Make AI move after player move
    if (gameStatus === "playing") {
      setTimeout(makeAIMove, 300);
    }

    return true;
  };

  const resetGame = () => {
    chess.current.reset();
    setFen(chess.current.fen());
    setMoveHistory([]);
    setGameStatus("playing");
    setWinner(null);
    setThinking(false);

    // If player is black, make AI move first
    if (playerColor === "black") {
      setTimeout(makeAIMove, 500);
    }
  };

  const undoMove = () => {
    if (moveHistory.length < 2 || thinking || gameStatus !== "playing") return;

    // Undo both player and AI moves
    chess.current.undo(); // AI move
    chess.current.undo(); // Player move

    setFen(chess.current.fen());
    setMoveHistory((prev) => prev.slice(0, -2));
    setGameStatus("playing");
    setWinner(null);
  };

  const switchSides = () => {
    const newColor = playerColor === "white" ? "black" : "white";
    setPlayerColor(newColor);
    resetGame();
  };

  // Initialize game when player color changes
  useEffect(() => {
    if (playerColor === "black" && moveHistory.length === 0) {
      setTimeout(makeAIMove, 500);
    }
  }, [playerColor]);

  const currentStyle = BOARD_STYLES[boardStyle];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          {/* <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button> */}
          <div>
            <h1 className="text-3xl font-bold">Chess Playground</h1>
            <p className="text-gray-400">
              Playing as {playerColor} vs{" "}
              {gameMode === "ai" ? `AI (${aiDifficulty})` : "Random"}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowStylePanel(!showStylePanel)}
            className="px-3 py-2 bg-purple-600 rounded-md hover:bg-purple-700 transition flex items-center"
          >
            <Palette className="w-4 h-4 mr-2" />
            Styles
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-2 py-2 bg-gray-800 rounded-md hover:bg-gray-700 transition flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">Game Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Game Mode
              </label>
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2"
              >
                <option value="ai">AI Opponent</option>
                <option value="random">Random Moves</option>
              </select>
            </div>

            {gameMode === "ai" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  AI Difficulty
                </label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Your Color
              </label>
              <select
                value={playerColor}
                onChange={(e) => setPlayerColor(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2"
              >
                <option value="white">White</option>
                <option value="black">Black</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Style Panel */}
      {showStylePanel && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">Board Styles</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(BOARD_STYLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => setBoardStyle(key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  boardStyle === key
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-gray-600 hover:border-gray-500"
                }`}
              >
                <div className="w-full h-12 mb-2 rounded flex">
                  <div
                    className="w-1/2 h-full"
                    style={style.lightSquareStyle}
                  ></div>
                  <div
                    className="w-1/2 h-full"
                    style={style.darkSquareStyle}
                  ></div>
                </div>
                <p className="text-sm font-medium">{style.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Game Controls */}
        <div className="lg:w-1/4">
          {/* Game Stats */}
          <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-3">Game Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-400">Wins:</span>
                <span className="font-bold">{gameStats.wins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Losses:</span>
                <span className="font-bold">{gameStats.losses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-400">Draws:</span>
                <span className="font-bold">{gameStats.draws}</span>
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-3">Game Controls</h3>
            <div className="space-y-2">
              <button
                onClick={resetGame}
                className="w-full px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 transition flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Game
              </button>
              <button
                onClick={undoMove}
                disabled={
                  moveHistory.length < 2 || thinking || gameStatus !== "playing"
                }
                className="w-full px-4 py-2 bg-yellow-600 rounded-md hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Undo Move
              </button>
              <button
                onClick={switchSides}
                className="w-full px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Switch Sides
              </button>
            </div>
          </div>

          {/* Game Status */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-3">Game Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Turn:</span>
                <span className="font-bold">
                  {chess.current.turn() === "w" ? "White" : "Black"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <span
                  className={`font-bold ${
                    gameStatus === "playing"
                      ? "text-green-400"
                      : gameStatus === "checkmate"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {gameStatus === "playing"
                    ? thinking
                      ? "AI Thinking..."
                      : "In Progress"
                    : gameStatus === "checkmate"
                    ? "Checkmate"
                    : "Draw"}
                </span>
              </div>
              {chess.current.isCheck() && gameStatus === "playing" && (
                <div className="text-red-400 font-bold text-center">CHECK!</div>
              )}
            </div>
          </div>
        </div>

        {/* Center Panel - Chessboard */}
        <div className="lg:w-1/2 flex flex-col items-center">
          {/* Game Result Overlay */}
          {gameStatus !== "playing" && (
            <div className="bg-gray-800 border-2 border-gray-600 rounded-xl p-6 mb-4 text-center">
              <h2 className="text-2xl font-bold mb-2">
                {gameStatus === "checkmate"
                  ? winner === playerColor
                    ? "You Won!"
                    : "You Lost!"
                  : "It's a Draw!"}
              </h2>
              <p className="text-gray-400 mb-4">
                {gameStatus === "checkmate" ? "By Checkmate" : "Game Drawn"}
              </p>
              <button
                onClick={resetGame}
                className="px-6 py-2 bg-green-600 rounded-md hover:bg-green-700 transition"
              >
                Play Again
              </button>
            </div>
          )}

          <div className="relative max-w-[500px] w-full">
            {thinking && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 bg-blue-600 text-white px-4 py-2 rounded-md">
                <Cpu className="inline w-4 h-4 mr-2" />
                AI Thinking...
              </div>
            )}

            <Chessboard
              position={fen}
              onPieceDrop={onDrop}
              boardOrientation={playerColor}
              arePiecesDraggable={gameStatus === "playing" && !thinking}
              customBoardStyle={{
                borderRadius: "8px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
              customLightSquareStyle={currentStyle.lightSquareStyle}
              customDarkSquareStyle={currentStyle.darkSquareStyle}
            />
          </div>
        </div>

        {/* Right Panel - Move History */}
        <div className="lg:w-1/4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-3">Move History</h3>
            <div className="max-h-96 overflow-y-auto">
              {moveHistory.length === 0 ? (
                <p className="text-gray-400 text-center">No moves yet</p>
              ) : (
                <div className="space-y-1">
                  {moveHistory.map((move, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center px-2 py-1 rounded ${
                        index === moveHistory.length - 1 ? "bg-blue-600/20" : ""
                      }`}
                    >
                      <span className="text-sm text-gray-400">
                        {Math.floor(index / 2) + 1}.
                        {index % 2 === 0 ? "" : ".."}
                      </span>
                      <span className="font-mono">{move}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
