import React from "react";
import Button from "@/components/ui/button";

export default function Profile() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">
        Player Profile
      </h1>
      <p className="text-gray-400 mb-8">
        View your stats, achievements, and customize your chess pieces
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Your Stats */}
        <div className="border border-gray-700 rounded-xl p-4">
          <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">1500</p>
              <p className="text-sm text-gray-400">Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold">#0</p>
              <p className="text-sm text-gray-400">Rank</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-400">Games</p>
            </div>
            <div>
              <p className="text-2xl font-bold">NaN%</p>
              <p className="text-sm text-gray-400">Win Rate</p>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-700 pt-2 text-sm">
            <p className="text-green-400">Wins: 0</p>
            <p className="text-yellow-400">Draws: 0</p>
            <p className="text-red-400">Losses: 0</p>
          </div>
        </div>

        {/* Achievements */}
        <div className="border border-gray-700 rounded-xl p-4">
          <h2 className="text-xl font-semibold mb-4">Achievements</h2>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-[#1c1c1c] p-2 rounded-lg">First Win</div>
            <div className="bg-[#1c1c1c] p-2 rounded-lg">Knight Master</div>
            <div className="bg-[#1c1c1c] p-2 rounded-lg">10 Game Streak</div>
            <div className="bg-[#161616] p-2 rounded-lg text-gray-500">
              Queen&rsquo;s Gambit
            </div>
            <div className="bg-[#161616] p-2 rounded-lg text-gray-500">
              Checkmate Pro
            </div>
            <div className="bg-[#161616] p-2 rounded-lg text-gray-500">
              Tournament Win
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-1">Progress</p>
            <div className="w-full h-2 bg-gray-800 rounded">
              <div
                className="bg-green-500 h-2 rounded"
                style={{ width: "50%" }}
              ></div>
            </div>
            <p className="text-xs text-right mt-1 text-gray-400">
              3/6 Achieved
            </p>
          </div>
        </div>

        {/* Piece Customization */}
        <div className="border border-gray-700 rounded-xl p-4">
          <h2 className="text-xl font-semibold mb-4">Piece Customization</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1">Current Theme</p>
            <div className="bg-[#1c1c1c] p-2 rounded-md mb-2">Standard</div>
            <p className="text-sm text-gray-400 mb-1">Board Style</p>
            <div className="bg-[#1c1c1c] p-2 rounded-md">
              Standard (Green/Cream)
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-2">Available Themes</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#1c1c1c] h-12 rounded-md flex items-center justify-center">
              ness
            </div>
            <div className="bg-[#1c1c1c] h-12 rounded-md flex items-center justify-center">
              ness
            </div>
            <div className="bg-[#1c1c1c] h-12 rounded-md text-gray-500 flex items-center justify-center">
              Locked
            </div>
            <div className="bg-[#1c1c1c] h-12 rounded-md text-gray-500 flex items-center justify-center">
              Locked
            </div>
          </div>
          <Button variant="secondary" className="w-full mt-4">
            Browse More Themes
          </Button>
        </div>
      </div>

      {/* Recent Games */}
      <div className="border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Games</h2>
        <div className="flex flex-col items-center justify-center text-center py-10">
          <div className="text-4xl mb-2">🏅</div>
          <p className="text-lg font-semibold mb-1">No Games Yet</p>
          <p className="text-gray-400 mb-4">
            You haven&apos;t played any games yet. Start a new game to begin
            your chess journey.
          </p>
          <Button className="bg-green-600 hover:bg-green-700">
            + Play First Game
          </Button>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <Button variant="outline">👤 Account Settings</Button>
      </div>
    </div>
  );
}
