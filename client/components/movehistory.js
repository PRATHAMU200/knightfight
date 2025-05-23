"use client";

import React from "react";

export default function MoveHistory({ moves = [] }) {
  // Group moves in pairs (white, black)
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i] || "",
      black: moves[i + 1] || "",
    });
  }

  return (
    <div className="bg-[#121212] border border-gray-700 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-4">Move History</h3>

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
