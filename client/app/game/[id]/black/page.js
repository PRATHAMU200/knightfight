"use client";
import React, { useState, useEffect } from "react";
import ChessBoard from "@/components/chessboard";
import Chat from "@/components/chat";
import MoveHistory from "@/components/movehistory";
import { Settings, Plus } from "lucide-react";
import { useParams } from "next/navigation";

function PlayerCard({ player, color }) {
  return (
    <div className="bg-[#121212] border border-gray-700 rounded-xl p-4 mb-4">
      <h3 className="text-white font-semibold mb-2">{color} Player</h3>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-xl font-bold">
          {player.avatar || color[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{player.name}</p>
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

export default function BlackGamePage() {
  const { id } = useParams();
  const color = "black"; // hardcoded because this page is specifically for Black player
  const [moves, setMoves] = useState([]);

  // Dummy player and game info data
  const blackPlayer = {
    name: "You (Black)",
    rating: 1400,
    timeLeft: "12:45",
    avatar: "B",
  };
  const whitePlayer = {
    name: "WhitePlayer",
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
            Game #{id} — Playing as{" "}
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </p>
        </div>
        <div className="flex space-x-4">
          <a
            href="/game/1234"
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
      <section className="flex flex-col md:flex-row space-x-0 md:space-x-6 flex-grow">
        {/* Left panel: Players + Game Info */}
        <div className="md:w-1/4 flex flex-col">
          <PlayerCard player={blackPlayer} color="Black" />
          <PlayerCard player={whitePlayer} color="White" />
          <GameInfo info={gameInfo} />
        </div>

        {/* Center panel: Chessboard + Move history */}
        <div className="md:w-2/4 flex flex-col space-y-4">
          <div className="flex justify-center">
            <ChessBoard
              gameId={id}
              color="black" // board perspective black
              onMovesUpdate={setMoves}
            />
          </div>
          <div className="flex-grow overflow-y-auto mt-2">
            <MoveHistory moves={moves} />
          </div>
        </div>

        {/* Right panel: Chat */}
        <div className="md:w-1/4 flex flex-col">
          <Chat gameId={id} playerName="BlackPlayer" />
        </div>
      </section>
    </div>
  );
}
