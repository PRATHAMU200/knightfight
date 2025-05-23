"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

export default function GameModal({ isOpen, onClose, onCreateGame }) {
  const [timeControl, setTimeControl] = useState("unlimited");
  const [timeLimit, setTimeLimit] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateGame({
      time_control: timeControl,
      time_limit: timeControl === "regular" ? timeLimit : null,
      is_private: isPrivate,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Create New Game</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2">Time Control</label>
            <select
              value={timeControl}
              onChange={(e) => setTimeControl(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
            >
              <option value="unlimited">Unlimited</option>
              <option value="regular">Timed Game</option>
            </select>
          </div>

          {timeControl === "regular" && (
            <div>
              <label className="block text-white mb-2">Time (minutes)</label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                min="1"
                max="60"
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
          )}

          <div>
            <label className="flex items-center text-white">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mr-2"
              />
              Private Game
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
