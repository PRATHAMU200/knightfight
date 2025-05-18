"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Settings, Plus } from "lucide-react";
import { io } from "socket.io-client";
import MoveHistory from "@/components/movehistory";
import Chat from "@/components/chat";

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

export default function WhiteGamePage() {
  const { id: gameId } = useParams();
  const { id } = useParams();
  const color = "black"; // hardcoded because this page is specifically for Black player
  const [moves, setMoves] = useState([]);

  // The ChessBoard component embedded inside this file for completeness
  function ChessBoard({ gameId, forcedColor = "white" }) {
    const chess = useRef(new Chess());
    const socketRef = useRef(null);
    const [fen, setFen] = useState(chess.current.fen());
    const [turn, setTurn] = useState("w");
    const [moves, setMoves] = useState([]);
    const [color, setColor] = useState(null); // white or black
    const [opponentOnline, setOpponentOnline] = useState(false);

    useEffect(() => {
      socketRef.current = io("http://localhost:3001");

      socketRef.current.emit("joinGame", gameId);

      socketRef.current.on("assignColor", (assignedColor) => {
        if (!forcedColor) {
          setColor(assignedColor);
        }
      });

      if (forcedColor) {
        setColor(forcedColor);
      }

      socketRef.current.on("gameState", ({ fen, moves }) => {
        if (fen) {
          chess.current.load(fen);
          setFen(fen);
          setMoves(moves || []);
          setTurn(chess.current.turn());
        }
      });

      socketRef.current.on("opponentMove", ({ fen, move }) => {
        chess.current.load(fen);
        setFen(fen);
        setMoves((prev) => [...prev, move]);
        setTurn(chess.current.turn());
      });

      socketRef.current.on("playerStatus", ({ status }) => {
        setOpponentOnline(status === "online");
      });

      socketRef.current.on("roomFull", () => {
        alert("This game already has two players. Cannot join.");
      });

      return () => {
        socketRef.current.disconnect();
      };
    }, [gameId, forcedColor]);

    function onDrop(sourceSquare, targetSquare) {
      if (!color) {
        alert("Waiting for server to assign your color...");
        return false;
      }

      // Check if it's player's turn
      if (
        (turn === "w" && color !== "white") ||
        (turn === "b" && color !== "black")
      ) {
        alert("It's not your turn!");
        return false;
      }

      const move = chess.current.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move === null) {
        alert("Invalid move");
        return false;
      }

      setFen(chess.current.fen());
      setTurn(chess.current.turn());
      setMoves((prev) => [...prev, move.san]);

      socketRef.current.emit("moveMade", {
        gameId,
        fen: chess.current.fen(),
        move: move.san,
      });

      return true;
    }

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
      <div style={{ maxWidth: 500, margin: "auto" }}>
        <div
          style={{
            marginBottom: 8,
            padding: 8,
            backgroundColor: "#222",
            color: "white",
            borderRadius: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 16,
          }}
        >
          {/* Turn status */}
          <div>
            {color && turn === (color === "white" ? "w" : "b") ? (
              <>
                <span style={{ fontWeight: "bold" }}>Your turn</span>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: color,
                    marginLeft: 6,
                  }}
                ></span>
              </>
            ) : (
              <>
                <span style={{ fontWeight: "bold" }}>Opponent's turn</span>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: color === "white" ? "black" : "white",
                    marginLeft: 6,
                    border: "1px solid #ccc",
                  }}
                ></span>
              </>
            )}
          </div>

          {/* Opponent status */}
          <div>
            Opponent:{" "}
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: opponentOnline ? "limegreen" : "red",
                marginLeft: 6,
              }}
              title={opponentOnline ? "Online" : "Offline"}
            ></span>
          </div>
        </div>

        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          boardOrientation={color || "white"}
          arePiecesDraggable={true}
          boardWidth={480}
        />
        <div style={{ marginTop: 12, color: "white", textAlign: "center" }}>
          <p>Moves: {moves.join(", ")}</p>
        </div>
      </div>
    );
  }
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
            Game #{id} — Playing as{"You are white "}
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
            <ChessBoard gameId={gameId} forcedColor="white" />
          </div>
          <div className="flex-grow overflow-y-auto mt-2">
            <MoveHistory moves={moves} />
          </div>
        </div>

        {/* Right panel: Chat */}
        <div className="md:w-1/4 flex flex-col">
          <Chat gameId={id} playerName="whitePlayer" />
        </div>
      </section>
    </div>
  );
}
