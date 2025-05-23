"use client";

import {
  Share2,
  Settings,
  UserPlus,
  PlayIcon,
  Clock,
  Crown,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const router = useRouter();

  const startGame = async ({
    timeControl = "unlimited",
    timeLimit = null,
    specterLink = null,
  }) => {
    try {
      const response = await fetch("http://localhost:3001/createnewgame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          time_control: timeControl,
          time_limit: timeLimit,
          specter_link: specterLink,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Game created with ID:", data.game_id);
        router.push(`/game/${data.game_id}/?choice=white`);
      } else {
        console.error("Failed to create game:", data.message);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };

  return (
    <div className="text-white px-6 md:px-20 py-8 space-y-16">
      {/* Section 1: Live Chess */}
      <section className="flex flex-col md:flex-row justify-between items-center md:items-start">
        <div className="mb-8 md:mb-0">
          <h1 className="text-3xl font-bold">Live Chess</h1>
          <p className="text-gray-400 mt-2">
            Play against opponents around the world.
          </p>
        </div>
        <div className="flex space-x-4">
          <button className="bg-[#20b155] text-white hover:brightness-110 border border-[#20b155] px-4 py-2 rounded flex items-center">
            <PlayIcon className="w-4 h-4 mr-2" /> New Game
          </button>
          <button className="border border-gray-500 text-gray-200 hover:text-white px-4 py-2 rounded flex items-center">
            <UserPlus className="w-4 h-4 mr-2" /> Play as Guest
          </button>
          <button className="border border-gray-500 text-gray-200 hover:text-white px-4 py-2 rounded flex items-center">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </button>
        </div>
      </section>

      {/* Section 2: Game Modes */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="border border-gray-700 bg-transparent rounded p-6">
          <span className="flex  items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-bold ">Quick Play</h2>
          </span>
          <p className="text-gray-400 mb-4">
            Fast-paced games with time controls of 5-15 minutes
          </p>
          <div className="space-x-2 flex justify-center ">
            <button
              onClick={() =>
                startGame({ timeControl: "regular", timeLimit: 5 })
              }
              className="border border-gray-600 text-gray-300 px-3 py-1 rounded w-full"
            >
              5 Min
            </button>
            <button
              onClick={() =>
                startGame({ timeControl: "regular", timeLimit: 10 })
              }
              className="border border-gray-600 text-gray-300 px-3 py-1 rounded w-full"
            >
              <a>10 Min</a>
            </button>
            <button className="border border-gray-600 text-gray-300 px-3 py-1 rounded w-full">
              <a href="/game/5">15 Min</a>
            </button>
          </div>
        </div>

        <div className="border border-gray-700 bg-transparent rounded p-6">
          <span className="flex  items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-cyan-500" />
            <h2 className="text-xl font-bold">Standard Game</h2>
          </span>
          <p className="text-gray-400 mb-4">
            Classic chess with standard rules and time controls
          </p>
          <button
            onClick={startGame}
            className="bg-[#20b155] text-white hover:brightness-110 border border-[#20b155] px-4 py-2 rounded w-full"
          >
            <a>Start Standard Game</a>
          </button>
        </div>

        <div className="border border-gray-700 bg-transparent rounded p-6">
          <span className="flex  items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Ranked Match</h2>
          </span>
          <p className="text-gray-400 mb-4">
            Competitive games that affect your rating
          </p>
          <button className="border border-gray-600 text-gray-300 px-4 py-2 rounded w-full">
            Play Ranked
          </button>
        </div>
      </section>

      {/* Section 3: Active Games */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Your Active Games</h2>
        <div className="border border-gray-700 bg-transparent rounded p-6 flex flex-col items-center">
          <p className="text-gray-400 mb-4">You don't have any active games</p>
          <button
            onClick={startGame}
            className="bg-[#20b155] text-white hover:brightness-110 border border-[#20b155] px-4 py-2 rounded"
          >
            Start a New Game
          </button>
        </div>
      </section>

      {/* Section 4: Share & Play */}
      <section>
        <div className="border border-gray-700 bg-transparent rounded p-6">
          <div className="flex items-center mb-2">
            <Share2 className="w-5 h-5 mr-2 text-[#20b155]" />
            <h2 className="text-xl font-bold">Share & Play</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Create a game and share the link with a friend to play together
          </p>
          <button
            onClick={startGame}
            className="text-white hover:brightness-110 border border-gray-600 px-4 py-2 rounded w-full"
          >
            Create & Share Game Link
          </button>
        </div>
      </section>
    </div>
  );
}
