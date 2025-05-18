"use client";
import React, { useState, useEffect } from "react";
import ChessBoard from "@/components/chessboard";
import Chat from "@/components/chat";
import MoveHistory from "@/components/movehistory";
import { Settings, Share2, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";

function PlayerCard({ player, color }) {
  /* unchanged */
}
function GameInfo({ info }) {
  /* unchanged */
}

export default function GamePage() {
  const { id } = useParams();
  const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("");
  const [socket, setSocket] = useState(null); // Add socket state

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Initialize socket connection once per game
  useEffect(() => {
    const newSocket = io("http://localhost:3001"); // or your actual backend URL
    setSocket(newSocket);

    // Join room for this gameId
    newSocket.emit("joinRoom", id);

    return () => {
      newSocket.disconnect();
    };
  }, [id]);

  const blackPlayerLink = `${origin}/game/${id}/black`;
  const spectatorLink = `${origin}/spectate/${id}`;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  function Dropdown() {
    /* unchanged */
  }

  // Dummy data for now
  const blackPlayer = {
    /* unchanged */
  };
  const whitePlayer = {
    /* unchanged */
  };
  const gameInfo = {
    /* unchanged */
  };

  const [moves, setMoves] = useState([]);

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col space-y-6">
      {/* Top Section, Left column, etc. unchanged */}

      {/* Main content sections */}
      <section className="flex flex-col md:flex-row space-x-0 md:space-x-6 flex-grow">
        {/* Left column */}
        <div className="md:w-1/4 flex flex-col">
          <PlayerCard player={blackPlayer} color="Black" />
          <PlayerCard player={whitePlayer} color="White" />
          <GameInfo info={gameInfo} />
        </div>

        {/* Center column */}
        <div className="md:w-2/4 flex flex-col space-y-4">
          <div className="flex justify-center">
            {/* Pass socket down */}
            <ChessBoard
              gameId={id}
              color="white"
              onMovesUpdate={setMoves}
              socket={socket}
            />
          </div>
          <div className="flex-grow overflow-y-auto mt-2">
            <MoveHistory moves={moves} />
          </div>
        </div>

        {/* Right column */}
        <div className="md:w-1/4 flex flex-col">
          {/* Pass socket down */}
          <Chat gameId={id} socket={socket} />
        </div>
      </section>
    </div>
  );
}
