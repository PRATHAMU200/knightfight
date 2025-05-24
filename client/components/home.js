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
import { useState, useEffect } from "react";

import { v4 as uuidv4 } from "uuid";
import GameModal from "@/components/gamemodal";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [publicGames, setPublicGames] = useState([]);
  const serveruri = process.env.NEXT_PUBLIC_SERVER_API_URL;

  const startGame = async (gameOptions = {}) => {
    const defaultOptions = {
      time_control: "unlimited",
      time_limit: null,
      specter_link: null,
      is_private: false,
      ...gameOptions,
    };

    try {
      const response = await fetch(serveruri + "/createnewgame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(defaultOptions),
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

  const fetchPublicGames = async () => {
    try {
      const response = await fetch(serveruri + "/public-games");
      const games = await response.json();
      setPublicGames(games);
      console.log(games);
    } catch (error) {
      console.error("Error fetching public games:", error);
    }
  };

  useEffect(() => {
    fetchPublicGames();
    const interval = setInterval(fetchPublicGames, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

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
          <button
            className="bg-[#20b155] text-white hover:brightness-110 border border-[#20b155] px-3 py-2 rounded flex items-center"
            onClick={() => setShowModal(true)}
          >
            <PlayIcon className="w-4 h-4 mr-2" /> New Game
          </button>
          <Link href={"/playground"}>
            <button className="border border-gray-500 text-gray-200 hover:text-white px-4 py-2 rounded flex items-center">
              <UserPlus className="w-4 h-4 mr-2" />
              PlayGround
            </button>
          </Link>
          {/* <button className="border border-gray-500 text-gray-200 hover:text-white px-4 py-2 rounded flex items-center">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </button> */}
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
                startGame({ time_control: "regular", time_limit: 5 })
              }
              className="border border-gray-600 text-gray-300 px-3 py-1 rounded w-full"
            >
              5 Min
            </button>
            <button
              onClick={() =>
                startGame({ time_control: "regular", time_limit: 10 })
              }
              className="border border-gray-600 text-gray-300 px-3 py-1 rounded w-full"
            >
              10 Min
            </button>
            <button
              className="border border-gray-600 text-gray-300 px-3 py-1 rounded w-full"
              onClick={() =>
                startGame({ time_control: "regular", time_limit: 15 })
              }
            >
              15 Min
            </button>
          </div>
        </div>

        <div className="border border-gray-700 bg-transparent rounded p-6">
          <span className="flex  items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Standard Game</h2>
          </span>
          <p className="text-gray-400 mb-4">
            Classic chess with standard rules and time controls
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#20b155] text-white hover:brightness-110 border border-[#20b155] px-4 py-2 rounded w-full"
          >
            Start Standard Game
          </button>
        </div>

        <div className="border border-gray-700 bg-transparent rounded p-6">
          <span className="flex  items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-cyan-500" />
            <h2 className="text-xl font-bold">Play with Computer</h2>
          </span>
          <p className="text-gray-400 mb-4">
            Learn by Practicing with Computer
          </p>
          <Link href={"/playground"}>
            <button className="border border-gray-600 text-gray-300 px-4 py-2 rounded w-full">
              Practice Playground
            </button>
          </Link>
        </div>
      </section>

      {/* Section 3: Active Games */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Your Active Games</h2>
        <div className="border border-gray-700 bg-transparent rounded p-6 flex flex-col items-center">
          <p className="text-gray-400 mb-4">
            You don&apos;t have any active games
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#20b155] text-white hover:brightness-110 border border-[#20b155] px-4 py-2 rounded"
          >
            Start a New Game
          </button>
        </div>
      </section>
      {/* Section 4: Public Games */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Join Public Games</h2>
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {publicGames.length === 0 ? (
            <div className="border border-gray-700 bg-transparent rounded p-6 text-center">
              <p className="text-gray-400">No public games available</p>
            </div>
          ) : (
            publicGames.map((game) => (
              <div
                key={game.game_id}
                className="border border-gray-700 bg-transparent rounded p-4 flex justify-between items-center"
              >
                <div>
                  <p className="text-white font-semibold">
                    {game.time_control === "unlimited"
                      ? "Unlimited"
                      : `${game.time_limit} min`}{" "}
                    Game
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {game.white_player ? (
                      <span className="text-white flex items-center gap-1">
                        ♙ <span className="text-sm text-gray-400">White</span>
                      </span>
                    ) : (
                      <span className="text-gray-600 flex items-center gap-1">
                        ♙ <span className="text-sm text-gray-500">White</span>
                      </span>
                    )}
                    {game.black_player ? (
                      <span className="text-white flex items-center gap-1">
                        ♟ <span className="text-sm text-gray-400">Black</span>
                      </span>
                    ) : (
                      <span className="text-gray-600 flex items-center gap-1">
                        ♟ <span className="text-sm text-gray-500">Black</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-x-2">
                  {/* {game.playercount < 2 ? (
                    <button
                      onClick={() =>
                        router.push(`/game/${game.game_id}?choice=player`)
                      }
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Join as Player
                    </button>
                  ) : (
                    <button
                      disabled
                      className="bg-gray-600 text-gray-400 px-4 py-2 rounded cursor-not-allowed"
                    >
                      Full
                    </button>
                  )} */}

                  <button
                    onClick={() =>
                      router.push(`/game/${game.game_id}?choice=spectator`)
                    }
                    className="border border-gray-600 text-gray-300 px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Spectate
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      {/* Section 5: Share & Play */}
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
            onClick={() => startGame()}
            className="text-white hover:brightness-110 border border-gray-600 px-4 py-2 rounded w-full"
          >
            Create & Share Game Link
          </button>
        </div>
      </section>
      <GameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreateGame={startGame}
      />
    </div>
  );
}
