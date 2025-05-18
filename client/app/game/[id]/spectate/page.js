import React from "react";
import { Chessboard } from "react-chessboard";

export default function SpectatorChessBoard({
  fen,
  moves = [],
  perspective = "white",
  status = null,
}) {
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
          <span className="text-sm font-medium">Watching the Game</span>
        )}
      </div>

      {/* Chessboard */}
      <Chessboard
        id="SpectatorBoard"
        position={fen}
        boardWidth={500}
        boardOrientation={perspective}
        arePiecesDraggable={false} // disable dragging for spectator
        customBoardStyle={{
          borderRadius: "10px",
          boxShadow: "0 0 15px rgba(0,0,0,0.5)",
        }}
      />

      {/* Moves History */}
      <div className="w-[500px] mt-4 max-h-48 overflow-y-auto bg-gray-900 text-white p-2 rounded">
        <h3 className="mb-2 font-semibold">Moves History</h3>
        <ul className="text-xs space-y-1">
          {moves.map((move, i) => (
            <li key={i}>{move}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
