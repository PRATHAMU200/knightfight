import React, { useEffect, useRef } from "react";

export default function MoveHistory({ moves = [], gameId }) {
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [moves]);

  return (
    <div className="bg-[#0e0e0e] border border-gray-700 rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-2 text-white">Move History</h2>
      <div
        className="overflow-y-auto max-h-[200px] pr-2 flex flex-col-reverse"
        ref={scrollRef}
      >
        {moves.length === 0 ? (
          <p className="text-gray-400">No moves yet</p>
        ) : (
          <ol className="text-gray-300 space-y-1 text-sm flex flex-col-reverse">
            {[...moves].reverse().map((move, index) => (
              <li key={index}>
                <span className="text-gray-500">
                  {Math.floor((moves.length - 1 - index) / 2) + 1}.
                </span>{" "}
                {move}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
