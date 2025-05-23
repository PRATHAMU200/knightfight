"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Settings, Plus } from "lucide-react";
import MoveHistory from "@/components/movehistory";
import Chat from "@/components/chat";
import ChessBoard from "@/components/chessboard";
import socketManager from "@/components/utils/socketManager";

function PlayerCard({ player, color, isOnline = false, timeLeft }) {
  // Update player cards to show time:
  const formatTime = (seconds) => {
    if (seconds == null && seconds === undefined) return "∞";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
          <p className="text-gray-400 text-sm">
            Time left: {formatTime(timeLeft)}
          </p>
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
    choiceFromQuery === "black"
      ? "black"
      : choiceFromQuery === "spectator"
      ? "spectator"
      : "white";
  console.log("So from here the color we get is : " + color);
  const [moves, setMoves] = useState([]);
  const [playersOnline, setPlayersOnline] = useState(0);
  const [spectatorsOnline, setSpectatorsOnline] = useState(0);
  const [assignedColor, setAssignedColor] = useState(color);
  const [gameEnded, setGameEnded] = useState(false);
  const [whiteTime, setWhiteTime] = useState(null);
  const [blackTime, setBlackTime] = useState(null);
  const [currentTurn, setCurrentTurn] = useState("white");

  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  // useEffect(() => {
  //   console.log("Timer values updated:", { whiteTime, blackTime });
  // }, [whiteTime, blackTime]);
  useEffect(() => {
    const spectatorMode = searchParams.get("choice") === "spectator";
    setIsSpectator(spectatorMode);
  }, [searchParams]);

  useEffect(() => {
    if (!gameId) return;

    // Set up game-level listeners
    socketManager.on(
      "playerStatus",
      ({ playersOnline: online, players, spectatorsOnline }) => {
        setPlayersOnline(online);
        setSpectatorsOnline(spectatorsOnline || 0);
      },
      "gamePagePlayerStatus"
    );

    socketManager.on(
      "assignColor",
      (newColor) => {
        setAssignedColor(newColor);
        console.log("Set the color to: " + newColor);
      },
      "gamePageAssignColor"
    );

    socketManager.on(
      "loadMoves",
      (moveHistory, gameState) => {
        if (moveHistory && moveHistory.length > 0) {
          const moveList = moveHistory.map((m) => m.move);
          setMoves(moveList);
        }
        // Set game ended state if winner exists
        if (gameState && gameState.winner) {
          setGameEnded(true);
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

  useEffect(() => {
    const checkGameStatus = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/game/${gameId}/status`
        );
        const data = await response.json();
        if (data.winner) {
          setGameEnded(true);
        }
      } catch (error) {
        console.error("Error checking game status:", error);
      }
    };

    if (gameId) {
      checkGameStatus();
    }
  }, [gameId]);

  const generateGuestId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "Guest";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Create player objects without timeLeft (we'll pass it separately)
  const blackPlayer = {
    name: assignedColor === "black" ? "You (Black)" : `Guest (Black)`,
    rating: 1400,
    avatar: "B",
  };

  const whitePlayer = {
    name: assignedColor === "white" ? "You (White)" : `Guest (White)`,
    rating: 1450,
    avatar: "W",
  };

  const [gameInfo, setGameInfo] = useState({
    type: "Standard",
    timeControl: "unlimited",
    otherDetails: "Online Match",
  });

  const copyShareLink = (role) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/game/${gameId}?choice=${role}`;
    navigator.clipboard.writeText(shareUrl);
    alert(
      `${
        role.charAt(0).toUpperCase() + role.slice(1)
      } link copied to clipboard!`
    );
    setShowShareDropdown(false);
  };

  // Add this useEffect for fetching game info:
  useEffect(() => {
    const fetchGameInfo = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/game/${gameId}/status`
        );
        const data = await response.json();
        setGameInfo({
          type: "Standard",
          timeControl:
            data.time_control === "unlimited"
              ? "Unlimited"
              : `${data.time_limit} minutes`,
          otherDetails: "Online Match",
        });

        // if (data.time_limit) {
        //   const timeInSeconds = data.time_limit * 60;
        //   setWhiteTime(timeInSeconds);
        //   setBlackTime(timeInSeconds);
        // }
      } catch (error) {
        console.error("Error fetching game info:", error);
      }
    };

    if (gameId) {
      fetchGameInfo();
    }
  }, [gameId]);

  useEffect(() => {
    const handleTimerUpdate = ({ whiteTime, blackTime, currentTurn }) => {
      // console.log("Timer update received:", {
      //   whiteTime,
      //   blackTime,
      //   currentTurn,
      // });
      setWhiteTime(whiteTime);
      setBlackTime(blackTime);
      setCurrentTurn(currentTurn);
    };

    socketManager.on("timerUpdate", handleTimerUpdate, "gamePageTimerUpdate");

    return () => {
      socketManager.off("timerUpdate");
    };
  }, []);

  useEffect(() => {
    const handleGameEnded = ({ winner, reason }) => {
      console.log("Game ended:", winner, reason);
      setGameEnded(true);
      // Stop any local timers since game is over
    };

    socketManager.on("gameEnded", handleGameEnded, "gamePageGameEnded");

    return () => {
      socketManager.off("gameEnded");
    };
  }, []);

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
            {/* ({playersOnline}/2 players online) */}
          </p>
        </div>
        <div className="flex space-x-4">
          <a
            href="/"
            className="px-4 py-2 bg-[#20b155] rounded-md font-semibold hover:brightness-110 transition"
          >
            <Plus className="inline-block mr-2 w-4 h-4" />
            New Game
          </a>
          <div className="relative">
            <button
              onClick={() => setShowShareDropdown(!showShareDropdown)}
              className="px-4 py-2 border border-gray-600 rounded-md hover:bg-green-700 transition"
            >
              Share Game
            </button>
            {showShareDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10">
                <button
                  onClick={() => copyShareLink("white")}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-700"
                >
                  Share to White Player
                </button>
                <button
                  onClick={() => copyShareLink("black")}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-700"
                >
                  Share to Black Player
                </button>
                <button
                  onClick={() => copyShareLink("spectator")}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-700"
                >
                  Share to Spectator
                </button>
              </div>
            )}
          </div>
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
            timeLeft={blackTime}
            isOnline={
              playersOnline > 0 &&
              (assignedColor === "black" || playersOnline === 2)
            }
          />
          <PlayerCard
            player={whitePlayer}
            color="White"
            timeLeft={whiteTime}
            isOnline={
              playersOnline > 0 &&
              (assignedColor === "white" || playersOnline === 2)
            }
          />
          <GameInfo info={gameInfo} />
        </div>

        {/* Center panel: Chessboard + Move history */}
        <div className="lg:w-2/4 flex flex-col space-y-4">
          <div
            style={{
              textAlign: "center",
              marginBottom: "10px",
              color: "#666",
              fontSize: "14px",
            }}
          >
            Spectators Online: {spectatorsOnline}
          </div>

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
            gameEnded={gameEnded}
            isSpectator={isSpectator}
          />
        </div>
      </section>
    </div>
  );
}
