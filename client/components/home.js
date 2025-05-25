"use client";

import {
  Share2,
  Settings,
  UserPlus,
  PlayIcon,
  Clock,
  Crown,
  Trophy,
  Loader2,
  EyeClosedIcon,
  Eye,
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
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [loadingGameType, setLoadingGameType] = useState(null);
  const serveruri = process.env.NEXT_PUBLIC_SERVER_API_URL;

  const startGame = async (gameOptions = {}) => {
    const defaultOptions = {
      time_control: "unlimited",
      time_limit: null,
      specter_link: null,
      is_private: false,
      ...gameOptions,
    };

    setIsCreatingGame(true);
    setLoadingGameType(gameOptions.time_limit || "standard");

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
        alert("Failed to create game. Please try again.");
      }
    } catch (error) {
      console.error("Error during fetch:", error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsCreatingGame(false);
      setLoadingGameType(null);
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

  const LoadingButton = ({
    children,
    isLoading,
    loadingText,
    onClick,
    className,
    ...props
  }) => (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`${className} transition-all duration-200 ${
        isLoading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
      }`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );

  return (
    <div className="text-white px-6 md:px-20 py-8 space-y-16">
      {/* Section 1: Live Chess */}
      <section className="flex flex-col md:flex-row justify-between items-center md:items-start">
        <div className="mb-8 md:mb-0">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Live Chess
          </h1>
          <p className="text-gray-400 mt-2">
            Play against opponents around the world.
          </p>
        </div>
        <div className="flex space-x-4">
          <LoadingButton
            className="bg-gradient-to-r from-[#20b155] to-[#25d661] text-white border border-[#20b155] px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => setShowModal(true)}
            isLoading={isCreatingGame && loadingGameType === "standard"}
            loadingText="Creating..."
          >
            <div className="flex items-center">
              <PlayIcon className="w-4 h-4 mr-2" /> New Game
            </div>
          </LoadingButton>
          <Link href={"/playground"}>
            <button className="border border-gray-500 text-gray-200 hover:text-white hover:border-gray-400 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <div className="flex items-center">
                <UserPlus className="w-4 h-4 mr-2" />
                PlayGround
              </div>
            </button>
          </Link>
        </div>
      </section>

      {/* Section 2: Game Modes */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="border border-gray-700 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-xl p-6 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
          <span className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-bold">Quick Play</h2>
          </span>
          <p className="text-gray-400 mb-6">
            Fast-paced games with time controls of 5-15 minutes
          </p>
          <div className="space-x-2 flex justify-center">
            <LoadingButton
              onClick={() =>
                startGame({ time_control: "regular", time_limit: 5 })
              }
              className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-lg w-full transition-all duration-200"
              isLoading={isCreatingGame && loadingGameType === 5}
              loadingText="5 Min"
            >
              5 Min
            </LoadingButton>
            <LoadingButton
              onClick={() =>
                startGame({ time_control: "regular", time_limit: 10 })
              }
              className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-lg w-full transition-all duration-200"
              isLoading={isCreatingGame && loadingGameType === 10}
              loadingText="10 Min"
            >
              10 Min
            </LoadingButton>
            <LoadingButton
              onClick={() =>
                startGame({ time_control: "regular", time_limit: 15 })
              }
              className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-lg w-full transition-all duration-200"
              isLoading={isCreatingGame && loadingGameType === 15}
              loadingText="15 Min"
            >
              15 Min
            </LoadingButton>
          </div>
        </div>

        <div className="border border-gray-700 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-xl p-6 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
          <span className="flex items-center gap-2 mb-3">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Standard Game</h2>
          </span>
          <p className="text-gray-400 mb-6">
            Classic chess with standard rules and time controls
          </p>
          <LoadingButton
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-[#20b155] to-[#25d661] text-white border border-[#20b155] px-4 py-2 rounded-lg w-full shadow-lg hover:shadow-xl transition-all duration-200"
            isLoading={isCreatingGame && loadingGameType === "standard"}
            loadingText="Creating..."
          >
            Start Standard Game
          </LoadingButton>
        </div>

        <div className="border border-gray-700 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-xl p-6 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
          <span className="flex items-center gap-2 mb-3">
            <Crown className="h-5 w-5 text-cyan-500" />
            <h2 className="text-xl font-bold">Play with Computer</h2>
          </span>
          <p className="text-gray-400 mb-6">
            Learn by Practicing with Computer
          </p>
          <Link href={"/playground"}>
            <button className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-4 py-2 rounded-lg w-full transition-all duration-200 hover:scale-105">
              Practice Playground
            </button>
          </Link>
        </div>
      </section>

      {/* Section 3: Active Games */}
      <section>
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Your Active Games
        </h2>
        <div className="border border-gray-700 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center hover:border-gray-600 transition-all duration-300">
          <p className="text-gray-400 mb-4">
            You don&apos;t have any active games
          </p>
          <LoadingButton
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-[#20b155] to-[#25d661] text-white border border-[#20b155] px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            isLoading={isCreatingGame && loadingGameType === "standard"}
            loadingText="Creating..."
          >
            Start a New Game
          </LoadingButton>
        </div>
      </section>

      {/* Section 4: Public Games */}
      <section>
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Join Public Games
        </h2>
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {publicGames.length === 0 ? (
            <div className="border border-gray-700 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-xl p-6 text-center hover:border-gray-600 transition-all duration-300">
              <p className="text-gray-400">No public games available</p>
            </div>
          ) : (
            publicGames.map((game) => (
              <div
                key={game.game_id}
                className="border border-gray-700 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-xl p-4 flex justify-between items-center hover:border-gray-600 transition-all duration-300 hover:shadow-lg"
              >
                <div>
                  <p className="text-white font-semibold">
                    {game.time_control === "unlimited"
                      ? "Unlimited"
                      : `${game.time_limit} min`}{" "}
                    Game
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span
                      className={`flex items-center gap-1 ${
                        game.hasWhite ? "text-white" : "text-gray-500"
                      }`}
                    >
                      ♙{" "}
                      <span className="text-sm">
                        White {game.hasWhite ? "✓" : "◯"}
                      </span>
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        game.hasBlack ? "text-white" : "text-gray-500"
                      }`}
                    >
                      ♛{" "}
                      <span className="text-sm">
                        Black {game.hasBlack ? "✓" : "◯"}
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">
                      {game.playerCount}/2 players
                    </span>
                  </div>
                </div>
                <div className="space-x-2 flex">
                  {game.canJoin ? (
                    <button
                      onClick={() =>
                        router.push(
                          `/game/${game.game_id}?choice=${
                            game.hasWhite ? "black" : "white"
                          }`
                        )
                      }
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      Join
                    </button>
                  ) : (
                    <button
                      disabled
                      className="bg-gray-600 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
                    >
                      Full
                    </button>
                  )}
                  <button
                    onClick={() =>
                      router.push(`/game/${game.game_id}?choice=spectator`)
                    }
                    className="border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    {/* Eye Icon - always shown on mobile, hidden on desktop */}
                    <Eye className="h-5 w-5 block md:hidden" />
                    {/* Spectate text - hidden on mobile, shown on desktop */}
                    <span className="hidden md:inline">Spectate</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Section 5: Share & Play */}
      <section>
        <div className="border border-gray-700 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-xl p-6 hover:border-gray-600 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center mb-3">
            <Share2 className="w-5 h-5 mr-2 text-[#20b155]" />
            <h2 className="text-xl font-bold">Share & Play</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Create a game and share the link with a friend to play together
          </p>
          <LoadingButton
            onClick={() => startGame()}
            className="text-white hover:bg-gray-700 border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-lg w-full transition-all duration-200"
            isLoading={isCreatingGame && loadingGameType === "standard"}
            loadingText="Creating..."
          >
            Create & Share Game Link
          </LoadingButton>
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
