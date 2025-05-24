"use client";

import React from "react";
import { useToast } from "@/components/ui/toast";
export default function MoveHistory({ moves = [], fens = [] }) {
  const { showToast, ToastContainer } = useToast();
  // Group moves in pairs (white, black)
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i] || "",
      black: moves[i + 1] || "",
    });
  }

  const handleCopyFENs = () => {
    navigator.clipboard.writeText(fens).then(() => {
      //alert("FENs copied to clipboard!");
      showToast("FENs copied to clipboard!...", "info");
    });
  };

  const handleDownloadPGN = () => {
    let pgn = "";
    for (let i = 0; i < moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moves[i] || "";
      const blackMove = moves[i + 1] || "";
      pgn += `${moveNumber}. ${whiteMove} ${blackMove} `;
    }

    const blob = new Blob([pgn.trim()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "game.pgn";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#121212] border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Move History</h3>
        <ToastContainer position="bottom-right" />
        <div className="flex gap-2">
          <button
            onClick={handleCopyFENs}
            className="text-xs text-blue-400 border border-blue-500 px-2 py-1 rounded hover:bg-blue-500/20 transition"
          >
            Copy FEN
          </button>
          <button
            onClick={handleDownloadPGN}
            className="text-xs text-blue-400 border border-blue-500 px-2 py-1 rounded hover:bg-blue-500/20 transition"
          >
            Download PGN
          </button>
        </div>
      </div>

      {moves.length === 0 ? (
        <div className="text-gray-400 text-center py-4">
          No moves yet. The game will begin when both players are ready.
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 text-sm">
            {/* Header */}
            <div className="text-gray-400 font-semibold">#</div>
            <div className="text-gray-400 font-semibold">White</div>
            <div className="text-gray-400 font-semibold">Black</div>

            {/* Move pairs */}
            {movePairs.map((pair, index) => (
              <React.Fragment key={index}>
                <div className="text-gray-300">{pair.moveNumber}</div>
                <div className="text-white font-mono">{pair.white}</div>
                <div className="text-white font-mono">{pair.black}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        Total moves: {moves.length}
      </div>
    </div>
  );
}
