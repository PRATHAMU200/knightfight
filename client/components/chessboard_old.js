import React, { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessBoard({
  onMove,
  onMovesUpdate,
  perspective = "white",
  isSpectator = false,
  externalFen, // optional prop to update fen externally
  externalMoves = [], // optional moves history externally
}) {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [turn, setTurn] = useState("w");
  const [status, setStatus] = useState(null);
  const boardRef = useRef();

  // When externalFen updates (for spectators), sync local fen
  useEffect(() => {
    if (externalFen && isSpectator) {
      setFen(externalFen);
      game.load(externalFen); // sync internal chess.js state
      setTurn(game.turn());
      updateGameStatus();
    }
  }, [externalFen, isSpectator]);

  const updateGameStatus = () => {
    if (game.isCheckmate()) {
      setStatus(
        turn === "w" ? "You lost by checkmate" : "You won by checkmate"
      );
    } else if (game.isDraw()) {
      setStatus("Game drawn");
    } else if (game.isCheck()) {
      setStatus("Check");
    } else {
      setStatus(null);
    }
  };

  const handleMove = (sourceSquare, targetSquare) => {
    if (isSpectator) return false; // block moves for spectators

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    };

    const result = game.move(move);

    if (result) {
      setFen(game.fen());
      setTurn(game.turn());
      updateGameStatus();

      if (onMove) onMove(result);

      if (onMovesUpdate) {
        const history = game.history().map((move, index) => {
          const player = index % 2 === 0 ? "White" : "Black";
          return `${player}: ${move}`;
        });
        onMovesUpdate(history);
      }
      return true;
    }
    return false;
  };

  useEffect(() => {
    boardRef.current?.clearPremoves?.();
  }, []);

  const getStatusStyle = () => {
    if (status?.includes("won")) return "bg-green-600";
    if (status?.includes("lost")) return "bg-red-600";
    if (status?.includes("draw")) return "bg-gray-600";
    if (status === "Check") return "bg-yellow-500";
    return "bg-transparent";
  };

  return (
    <div className="flex flex-col items-center">
      {/* Status / Turn Indicator */}
      <div
        className={`w-[500px] mb-2 text-center p-2 rounded-lg border border-gray-700 text-white flex justify-center items-center gap-2 ${getStatusStyle()}`}
      >
        {status ? (
          <span className="text-sm font-medium">{status}</span>
        ) : (
          <>
            <span
              className={`h-3 w-3 rounded-full ${
                turn === "w" ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            <span className="text-sm font-medium">
              {turn === "w"
                ? `Turn: ${perspective === "white" ? "White" : "Black"}`
                : `Turn: ${perspective === "white" ? "Black" : "White"}`}
            </span>
          </>
        )}
      </div>

      {/* Chessboard */}
      <Chessboard
        id="Chessboard"
        position={fen}
        onPieceDrop={handleMove}
        boardRef={boardRef}
        boardWidth={500}
        customBoardStyle={{
          borderRadius: "10px",
          boxShadow: "0 0 15px rgba(0,0,0,0.5)",
        }}
        boardOrientation={perspective}
        arePiecesDraggable={!isSpectator}
      />

      {/* Moves history */}
      <div className="w-[500px] mt-4 max-h-48 overflow-y-auto bg-gray-900 text-white p-2 rounded">
        <h3 className="mb-2 font-semibold">Moves History</h3>
        <ul className="text-xs space-y-1">
          {(isSpectator ? externalMoves : game.history()).map((move, i) => {
            const player = i % 2 === 0 ? "White" : "Black";
            return <li key={i}>{`${player}: ${move}`}</li>;
          })}
        </ul>
      </div>
    </div>
  );
}
