"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import socketManager from "@/components/utils/socketManager";

export default function ChessBoard({ gameId, forcedColor = null }) {
  const chess = useRef(new Chess());
  const [fen, setFen] = useState(chess.current.fen());
  const [turn, setTurn] = useState("w");
  const [moves, setMoves] = useState([]);
  const [color, setColor] = useState(forcedColor);
  const [opponentOnline, setOpponentOnline] = useState(false);
  const [playersOnline, setPlayersOnline] = useState(0);

  useEffect(() => {
    if (!gameId) return;

    // Connect and join game
    socketManager.connect();
    socketManager.joinGame(gameId);

    // Set up event listeners
    socketManager.on(
      "assignColor",
      (assignedColor) => {
        console.log("Assigned color:", assignedColor);
        if (!forcedColor) {
          setColor(assignedColor);
        }
      },
      "assignColor"
    );

    socketManager.on(
      "loadMoves",
      (moveHistory) => {
        if (moveHistory && moveHistory.length > 0) {
          const lastMove = moveHistory[moveHistory.length - 1];
          if (lastMove.fen) {
            chess.current.load(lastMove.fen);
            setFen(lastMove.fen);
            setTurn(chess.current.turn());
          }
          const moveList = moveHistory.map((m) => m.move);
          setMoves(moveList);
        }
      },
      "loadMoves"
    );

    socketManager.on(
      "opponentMove",
      ({ fen: newFen, move }) => {
        chess.current.load(newFen);
        setFen(newFen);
        setMoves((prev) => [...prev, move]);
        setTurn(chess.current.turn());
      },
      "opponentMove"
    );

    socketManager.on(
      "playerStatus",
      ({ playersOnline: online, players }) => {
        setPlayersOnline(online);
        setOpponentOnline(online > 1);
      },
      "playerStatus"
    );

    socketManager.on(
      "roomFull",
      () => {
        alert("This game already has two players. Cannot join.");
      },
      "roomFull"
    );

    socketManager.on(
      "gameEnded",
      ({ winner }) => {
        alert(`Game ended! Winner: ${winner}`);
      },
      "gameEnded"
    );

    // Cleanup function
    return () => {
      socketManager.removeAllListeners();
    };
  }, [gameId, forcedColor]);

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
    const newFen = chess.current.fen();
    setFen(newFen);
    setTurn(chess.current.turn());
    setMoves((prev) => [...prev, move.san]);

    // Emit move to server
    socketManager.makeMove(gameId, move.san, newFen);

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
          Players online: {playersOnline}/2{" "}
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: opponentOnline ? "limegreen" : "red",
              marginLeft: 6,
            }}
            title={opponentOnline ? "Opponent Online" : "Waiting for opponent"}
          />
        </div>
      </div>

      {/* Chessboard */}
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        boardOrientation={color || "white"}
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
