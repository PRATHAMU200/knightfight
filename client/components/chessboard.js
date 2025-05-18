"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { io } from "socket.io-client";

export default function ChessBoard({ gameId }) {
  const chess = useRef(new Chess());
  const socketRef = useRef(null);
  const [fen, setFen] = useState(chess.current.fen());
  const [turn, setTurn] = useState("w"); // 'w' or 'b'
  const [moves, setMoves] = useState([]);
  const [color, setColor] = useState(null); // "white" or "black"
  const [opponentOnline, setOpponentOnline] = useState(false);

  useEffect(() => {
    // Connect to your socket.io server
    socketRef.current = io("http://localhost:3001");

    // Join the game room
    socketRef.current.emit("joinGame", gameId);

    // Receive assigned color from server
    socketRef.current.on("assignColor", (assignedColor) => {
      console.log("Assigned color:", assignedColor);
      setColor(assignedColor);
    });

    // Receive current game state (fen + moves)
    socketRef.current.on("gameState", ({ fen, moves }) => {
      if (fen) {
        chess.current.load(fen);
        setFen(fen);
        setMoves(moves || []);
        setTurn(chess.current.turn());
      }
    });

    // Receive opponent's move
    socketRef.current.on("opponentMove", ({ fen, move }) => {
      chess.current.load(fen);
      setFen(fen);
      setMoves((prev) => [...prev, move]);
      setTurn(chess.current.turn());
    });

    // Receive opponent online/offline status
    socketRef.current.on("playerStatus", ({ playerId, status }) => {
      setOpponentOnline(status === "online");
    });

    // Handle room full error
    socketRef.current.on("roomFull", () => {
      alert("This game already has two players. Cannot join.");
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [gameId]);

  // When a piece is dropped
  function onDrop(sourceSquare, targetSquare) {
    if (!color) {
      alert("Waiting for server to assign your color...");
      return false;
    }

    // Check if it's player's turn
    if (
      (turn === "w" && color !== "white") ||
      (turn === "b" && color !== "black")
    ) {
      alert("It's not your turn!");
      return false;
    }

    // Attempt the move
    const move = chess.current.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to queen for simplicity
    });

    if (move === null) {
      alert("Invalid move");
      return false;
    }

    // Update local state
    setFen(chess.current.fen());
    setTurn(chess.current.turn());
    setMoves((prev) => [...prev, move.san]);

    // Emit move to server
    socketRef.current.emit("moveMade", {
      gameId,
      fen: chess.current.fen(),
      move: move.san,
    });

    return true;
  }

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      {/* Status Bar */}
      <div
        style={{
          marginBottom: 8,
          padding: 8,
          backgroundColor: "#222",
          color: "white",
          borderRadius: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 16,
        }}
      >
        {/* Turn indicator */}
        <div>
          {color && turn === (color === "white" ? "w" : "b") ? (
            <>
              <span style={{ fontWeight: "bold" }}>Your turn</span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: color,
                  marginLeft: 6,
                }}
              />
            </>
          ) : (
            <>
              <span style={{ fontWeight: "bold" }}>Opponent's turn</span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: color === "white" ? "black" : "white",
                  marginLeft: 6,
                  border: "1px solid #ccc",
                }}
              />
            </>
          )}
        </div>

        {/* Opponent status */}
        <div>
          Opponent:{" "}
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: opponentOnline ? "limegreen" : "red",
              marginLeft: 6,
            }}
            title={opponentOnline ? "Online" : "Offline"}
          />
        </div>
      </div>

      {/* Chessboard */}
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        boardOrientation={color || "white"} // orientation based on assigned color
        arePiecesDraggable={true}
        boardWidth={480}
      />

      {/* Moves History */}
      <div style={{ marginTop: 12, color: "white", textAlign: "center" }}>
        <p>Moves: {moves.join(", ")}</p>
      </div>
    </div>
  );
}
