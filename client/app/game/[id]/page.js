"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Settings, Plus } from "lucide-react";
import MoveHistory from "@/components/movehistory";
import Chat from "@/components/chat";
import ChessBoard from "@/components/chessboard";
import socketManager from "@/components/utils/socketManager";

function PlayerCard({ player, color, isOnline = false }) {
  return (
    <div className="bg-[#121212] border border-gray-700 rounded-xl p-4 mb-4">
      <h3 className="text-white font-semibold mb-2 flex items-center">
        {color} Player
        <span
          className={`ml-2 w-3 h-3 rounded-full ${
            isOnline ? "bg-green-500" : "bg-red-500"
          }`}
          title={isOnline ? "Online" : "Offline"}
        />
      </h3>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-xl font-bold">
          {player.avatar || color[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white">{player.name}</p>
          <p className="text-gray-400 text-sm">Rating: {player.rating}</p>
          <p className="text-gray-400 text-sm">Time left: {player.timeLeft}</p>
        </div>
      </div>
    </div>
  );
}

function GameInfo({ info }) {
  return (
    <div className="bg-[#121212] border border-gray-700 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-2">Game Info</h3>
      <p className="text-gray-400">Type: {info.type}</p>
      <p className="text-gray-400">Time Control: {info.timeControl}</p>
      <p className="text-gray-400">{info.otherDetails}</p>
    </div>
  );
}

export default function GamePage() {
  const { id: gameId } = useParams();
  const searchParams = useSearchParams();
  const choiceFromQuery = searchParams.get("choice");
  const color =
    choiceFromQuery === "black" || choiceFromQuery === "white"
      ? choiceFromQuery
      : "white";

  const [moves, setMoves] = useState([]);
  const [playersOnline, setPlayersOnline] = useState(0);
  const [assignedColor, setAssignedColor] = useState(color);

  useEffect(() => {
    if (!gameId) return;

    // Set up game-level listeners
    socketManager.on(
      "playerStatus",
      ({ playersOnline: online }) => {
        setPlayersOnline(online);
      },
      "gamePagePlayerStatus"
    );

    socketManager.on(
      "assignColor",
      (newColor) => {
        setAssignedColor(newColor);
      },
      "gamePageAssignColor"
    );

    socketManager.on(
      "loadMoves",
      (moveHistory) => {
        if (moveHistory && moveHistory.length > 0) {
          const moveList = moveHistory.map((m) => m.move);
          setMoves(moveList);
        }
      },
      "gamePageLoadMoves"
    );

    socketManager.on(
      "opponentMove",
      ({ move }) => {
        setMoves((prev) => [...prev, move]);
      },
      "gamePageOpponentMove"
    );

    return () => {
      socketManager.off("playerStatus");
      socketManager.off("assignColor");
      socketManager.off("loadMoves");
      socketManager.off("opponentMove");
    };
  }, [gameId]);

  // Dummy player and game info data
  const blackPlayer = {
    name: assignedColor === "black" ? "You (Black)" : "Opponent (Black)",
    rating: 1400,
    timeLeft: "12:45",
    avatar: "B",
  };

  const whitePlayer = {
    name: assignedColor === "white" ? "You (White)" : "Opponent (White)",
    rating: 1450,
    timeLeft: "15:00",
    avatar: "W",
  };

  const gameInfo = {
    type: "Standard",
    timeControl: "10+5",
    otherDetails: "Online Match",
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col space-y-6">
      {/* Header */}
      <section className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Live Chess</h1>
          <p className="text-gray-400">
            Game #{gameId} — Playing as{" "}
            <span className="font-semibold text-white">
              {assignedColor?.charAt(0).toUpperCase() +
                assignedColor?.slice(1) || "Waiting..."}
            </span>{" "}
            ({playersOnline}/2 players online)
          </p>
        </div>
        <div className="flex space-x-4">
          <a
            href="/game/new"
            className="px-4 py-2 bg-[#20b155] rounded-md font-semibold hover:brightness-110 transition"
          >
            <Plus className="inline-block mr-2 w-4 h-4" />
            New Game
          </a>
          <button className="px-4 py-2 border border-gray-600 rounded-md hover:bg-green-700 transition">
            <Settings className="inline-block mr-2 w-4 h-4" />
            Settings
          </button>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex flex-col lg:flex-row space-x-0 lg:space-x-6 flex-grow">
        {/* Left panel: Players + Game Info */}
        <div className="lg:w-1/4 flex flex-col mb-6 lg:mb-0">
          <PlayerCard
            player={blackPlayer}
            color="Black"
            isOnline={
              playersOnline > 0 &&
              (assignedColor === "black" || playersOnline === 2)
            }
          />
          <PlayerCard
            player={whitePlayer}
            color="White"
            isOnline={
              playersOnline > 0 &&
              (assignedColor === "white" || playersOnline === 2)
            }
          />
          <GameInfo info={gameInfo} />
        </div>

        {/* Center panel: Chessboard + Move history */}
        <div className="lg:w-2/4 flex flex-col space-y-4">
          <div className="flex justify-center">
            <ChessBoard gameId={gameId} forcedColor={color} />
          </div>
          <div className="flex-grow overflow-y-auto mt-2">
            <MoveHistory moves={moves} />
          </div>
        </div>

        {/* Right panel: Chat */}
        <div className="lg:w-1/4 flex flex-col">
          <Chat
            gameId={gameId}
            playerName={
              assignedColor === "white" ? "WhitePlayer" : "BlackPlayer"
            }
          />
        </div>
      </section>
    </div>
  );
}
