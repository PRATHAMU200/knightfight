"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Settings,
  Plus,
  Palette,
  Crown,
  Clock,
  Users,
  Eye,
} from "lucide-react";
import MoveHistory from "@/components/movehistory";
import Chat from "@/components/chat";
import ChessBoard from "@/components/chessboard";
import socketManager from "@/components/utils/socketManager";
import { useToast } from "@/components/ui/toast";
import { getUser, isAuthenticated } from "@/components/utils/authUtils"; // Update path as needed

const serveruri = process.env.NEXT_PUBLIC_SERVER_API_URL;

const BOARD_STYLES = {
  classic: {
    name: "Classic",
    lightSquareStyle: { backgroundColor: "#f0d9b5" },
    darkSquareStyle: { backgroundColor: "#b58863" },
  },
  modern: {
    name: "Modern",
    lightSquareStyle: { backgroundColor: "#eeeed2" },
    darkSquareStyle: { backgroundColor: "#769656" },
  },
  blue: {
    name: "Ocean Blue",
    lightSquareStyle: { backgroundColor: "#dee3e6" },
    darkSquareStyle: { backgroundColor: "#8ca2ad" },
  },
  purple: {
    name: "Royal Purple",
    lightSquareStyle: { backgroundColor: "#f0d0ff" },
    darkSquareStyle: { backgroundColor: "#9f5f9f" },
  },
  dark: {
    name: "Dark Mode",
    lightSquareStyle: { backgroundColor: "#4a4a4a" },
    darkSquareStyle: { backgroundColor: "#2d2d2d" },
  },
  neon: {
    name: "Neon",
    lightSquareStyle: {
      backgroundColor: "#00ff41",
      boxShadow: "0 0 10px rgba(0,255,65,0.3)",
    },
    darkSquareStyle: {
      backgroundColor: "#003d0f",
      boxShadow: "0 0 10px rgba(0,255,65,0.1)",
    },
  },
};

function PlayerCard({
  player,
  color,
  isOnline = false,
  timeLeft,
  isCurrentTurn,
}) {
  const formatTime = (seconds) => {
    if (seconds == null || seconds === undefined) return "∞";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`bg-gray-800 border-2 rounded-xl p-4 mb-4 transition-all duration-300 ${
        isCurrentTurn
          ? "border-blue-500 shadow-lg shadow-blue-500/20"
          : "border-gray-700"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center">
          {color === "White" ? "⚪" : "⚫"} {color} Player
          {isCurrentTurn && <Crown className="ml-2 w-4 h-4 text-yellow-400" />}
        </h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isOnline ? "bg-green-500" : "bg-red-500"
            } shadow-lg`}
            title={isOnline ? "Online" : "Offline"}
          />
          {timeLeft !== null && (
            <div
              className={`px-2 py-1 rounded text-sm font-mono ${
                timeLeft < 60
                  ? "bg-red-600 text-white"
                  : timeLeft < 300
                  ? "bg-yellow-600 text-white"
                  : "bg-green-600 text-white"
              }`}
            >
              <Clock className="inline w-3 h-3 mr-1" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg ${
            color === "White"
              ? "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-800"
              : "bg-gradient-to-br from-gray-800 to-black"
          }`}
        >
          {player.avatar || color[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white">{player.name}</p>
          <p className="text-gray-400 text-sm flex items-center">
            <Crown className="w-3 h-3 mr-1" />
            Rating: {player.rating}
          </p>
        </div>
      </div>
    </div>
  );
}

function GameInfo({ info, gameStatus, winner }) {
  const getStatusColor = () => {
    if (gameStatus === "playing") return "text-green-400";
    if (gameStatus === "checkmate") return "text-red-400";
    return "text-yellow-400";
  };

  const getStatusText = () => {
    if (gameStatus === "playing") return "In Progress";
    if (gameStatus === "checkmate") return `Checkmate - ${winner} wins!`;
    if (gameStatus === "draw") return "Draw";
    return "Waiting to start";
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-3 flex items-center">
        <Settings className="w-4 h-4 mr-2" />
        Game Info
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Type:</span>
          <span className="text-white font-medium">{info.type}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Time:</span>
          <span className="text-white font-medium">{info.timeControl}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Mode:</span>
          <span className="text-white font-medium">{info.otherDetails}</span>
        </div>
        <div className="border-t border-gray-600 pt-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Status:</span>
            <span className={`font-bold ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>
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

  const [moves, setMoves] = useState([]);
  const [playersOnline, setPlayersOnline] = useState(0);
  const [spectatorsOnline, setSpectatorsOnline] = useState(0);
  const [assignedColor, setAssignedColor] = useState(color);
  const [gameEnded, setGameEnded] = useState(false);
  const [whiteTime, setWhiteTime] = useState(null);
  const [blackTime, setBlackTime] = useState(null);
  const [currentTurn, setCurrentTurn] = useState("white");
  const [gameStatus, setGameStatus] = useState("waiting");
  const [winner, setWinner] = useState(null);

  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [boardStyle, setBoardStyle] = useState("classic");
  const [fen, setFen] = useState([]);

  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    const spectatorMode = searchParams.get("choice") === "spectator";
    setIsSpectator(spectatorMode);
  }, [searchParams]);

  useEffect(() => {
    if (!gameId) return;

    socketManager.on(
      "playerStatus",
      ({ playersOnline: online, players, spectatorsOnline }) => {
        setPlayersOnline(online);
        setSpectatorsOnline(spectatorsOnline || 0);
        setGameStatus(online === 2 ? "playing" : "waiting");
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
      (moveHistory, gameState) => {
        if (moveHistory && moveHistory.length > 0) {
          const moveList = moveHistory.map((m) => m.move);
          setMoves(moveList);
          const fenList = moveHistory.map((m) => m.fen);
          setFen(fenList);
        }
        if (gameState && gameState.winner) {
          setGameEnded(true);
          setGameStatus("checkmate");
          setWinner(gameState.winner);
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

    socketManager.on(
      "gameEnded",
      ({ winner, reason }) => {
        setGameEnded(true);
        setGameStatus(reason === "draw" ? "draw" : "checkmate");
        setWinner(winner);
      },
      "gamePageGameEnded"
    );

    return () => {
      socketManager.off("playerStatus");
      socketManager.off("assignColor");
      socketManager.off("loadMoves");
      socketManager.off("opponentMove");
      socketManager.off("gameEnded");
    };
  }, [gameId]);

  useEffect(() => {
    const checkGameStatus = async () => {
      try {
        const response = await fetch(`${serveruri}/game/${gameId}/status`);
        const data = await response.json();
        if (data.winner) {
          setGameEnded(true);
          setGameStatus("checkmate");
          setWinner(data.winner);
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
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
        showToast(`${roleCapitalized} link copied to clipboard!`, "success");
      })
      .catch(() => {
        showToast("Failed to copy link to clipboard", "error");
      });
    setShowShareDropdown(false);
  };

  useEffect(() => {
    const fetchGameInfo = async () => {
      try {
        const response = await fetch(`${serveruri}/game/${gameId}/status`);
        const data = await response.json();
        setGameInfo({
          type: "Standard",
          timeControl:
            data.time_control === "unlimited"
              ? "Unlimited"
              : `${data.time_limit} minutes`,
          otherDetails: "Online Match",
        });

        if (data.time_limit) {
          const timeInSeconds = data.time_limit * 60;
          setWhiteTime(timeInSeconds);
          setBlackTime(timeInSeconds);
        }
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
      setWhiteTime(whiteTime);
      setBlackTime(blackTime);
      setCurrentTurn(currentTurn);
    };

    socketManager.on("timerUpdate", handleTimerUpdate, "gamePageTimerUpdate");

    return () => {
      socketManager.off("timerUpdate");
    };
  }, []);

  const currentStyle = BOARD_STYLES[boardStyle];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Live Chess
            </h1>
            <p className="text-gray-400">
              Game #{gameId} — Playing as{" "}
              <span className="font-semibold text-white">
                {assignedColor?.charAt(0).toUpperCase() +
                  assignedColor?.slice(1) || "Waiting..."}
              </span>
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowStylePanel(!showStylePanel)}
            className="px-4 py-2 bg-purple-600 rounded-md hover:bg-purple-700 transition flex items-center"
          >
            <Palette className="w-4 h-4 mr-2" />
            Styles
          </button>
          <div className="relative">
            {assignedColor !== "spectator" && (
              <>
                <button
                  onClick={() => setShowShareDropdown(!showShareDropdown)}
                  className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 transition flex items-center"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Invite
                </button>

                {showShareDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10">
                    <button
                      onClick={() => copyShareLink("white")}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-700 text-white"
                    >
                      ⚪ Share to White Player
                    </button>
                    <button
                      onClick={() => copyShareLink("black")}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-700 text-white"
                    >
                      ⚫ Share to Black Player
                    </button>
                    <button
                      onClick={() => copyShareLink("spectator")}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-700"
                    >
                      <Eye className="inline w-4 h-4 mr-2" />
                      Share to Spectator
                    </button>
                  </div>
                )}
              </>
            )}

            {assignedColor === "spectator" && (
              <button
                onClick={() => copyShareLink("spectator")}
                className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Share to Spectator
              </button>
            )}
          </div>
          {/* <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 transition flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button> */}
          {/* <a
            href="/"
            className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Game
          </a> */}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">Game Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Game Status
              </label>
              <div
                className={`px-4 py-2 rounded-md border ${
                  gameStatus === "playing"
                    ? "border-green-500 bg-green-500/10"
                    : gameStatus === "waiting"
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-red-500 bg-red-500/10"
                }`}
              >
                <span
                  className={`font-bold ${
                    gameStatus === "playing"
                      ? "text-green-400"
                      : gameStatus === "waiting"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {gameStatus === "playing"
                    ? "🟢 Game in Progress"
                    : gameStatus === "waiting"
                    ? "🟡 Waiting for Players"
                    : "🔴 Game Ended"}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Players Online
              </label>
              <div className="px-4 py-2 bg-gray-700 rounded-md border border-gray-600">
                <span className="font-bold">{playersOnline}/2 Players</span>
                {spectatorsOnline > 0 && (
                  <span className="ml-2 text-gray-400">
                    + {spectatorsOnline} Spectators
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Style Panel */}
      {showStylePanel && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">Board Styles</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(BOARD_STYLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => setBoardStyle(key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  boardStyle === key
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-gray-600 hover:border-gray-500"
                }`}
              >
                <div className="w-full h-12 mb-2 rounded flex">
                  <div
                    className="w-1/2 h-full"
                    style={style.lightSquareStyle}
                  ></div>
                  <div
                    className="w-1/2 h-full"
                    style={style.darkSquareStyle}
                  ></div>
                </div>
                <p className="text-sm font-medium">{style.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <section className="flex flex-col lg:flex-row gap-6">
        {/* Left panel: Players + Game Info */}
        <div className="lg:w-1/4 flex flex-col">
          <PlayerCard
            player={blackPlayer}
            color="Black"
            timeLeft={blackTime}
            isOnline={
              playersOnline > 0 &&
              (assignedColor === "black" || playersOnline === 2)
            }
            isCurrentTurn={assignedColor === "black"}
          />
          <PlayerCard
            player={whitePlayer}
            color="White"
            timeLeft={whiteTime}
            isOnline={
              playersOnline > 0 &&
              (assignedColor === "white" || playersOnline === 2)
            }
            isCurrentTurn={assignedColor === "white"}
          />
          <GameInfo info={gameInfo} gameStatus={gameStatus} winner={winner} />
        </div>

        {/* Center panel: Chessboard + Move history */}
        <div className="lg:w-2/4 flex flex-col space-y-4">
          {spectatorsOnline > 0 && (
            <div className="text-center bg-gray-800 rounded-lg p-2">
              <span className="text-gray-400 text-sm flex items-center justify-center">
                <Eye className="w-4 h-4 mr-2" />
                {spectatorsOnline} Spectator{spectatorsOnline > 1 ? "s" : ""}{" "}
                Watching
              </span>
            </div>
          )}

          <div className="flex justify-center">
            <ChessBoard
              gameId={gameId}
              forcedColor={color}
              boardStyle={currentStyle}
            />
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-3 text-white">
              Move History
            </h3>
            <div className="max-h-32 overflow-y-auto">
              <MoveHistory moves={moves} fens={fen} />
            </div>
          </div>
        </div>

        {/* Right panel: Chat */}
        <div className="lg:w-1/4 flex flex-col">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-h-[500px] overflow-y-auto">
            <Chat
              gameId={gameId}
              playerName={
                assignedColor === "white" ? "WhitePlayer" : "BlackPlayer"
              }
              gameEnded={gameEnded}
              isSpectator={isSpectator}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
