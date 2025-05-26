"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import socketManager from "@/components/utils/socketManager";
import { useToast } from "@/components/ui/toast";
import { updateUserStats, getUser } from "@/components/utils/authUtils";
import dotenv from "dotenv";
dotenv.config();
const serveruri = process.env.NEXT_PUBLIC_SERVER_API_URL;
export default function ChessBoard({
  gameId,
  forcedColor = null,
  boardStyle = null,
}) {
  const chess = useRef(new Chess());
  const [currentUser, setCurrentUser] = useState(null);
  const [fen, setFen] = useState(chess.current.fen());
  const [turn, setTurn] = useState("w");
  const [moves, setMoves] = useState([]);
  const [color, setColor] = useState(forcedColor);
  const [opponentOnline, setOpponentOnline] = useState(false);
  const [playersOnline, setPlayersOnline] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [drawOfferingPlayer, setDrawOfferingPlayer] = useState(null);
  const [userRole, setUserRole] = useState("player");
  const [spectatorsOnline, setSpectatorsOnline] = useState(0);
  const [whiteTime, setWhiteTime] = useState(null);
  const [blackTime, setBlackTime] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
  const { showToast, ToastContainer } = useToast();
  const [showUndoRequest, setShowUndoRequest] = useState(false);
  const [undoRequestingPlayer, setUndoRequestingPlayer] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);

  const playersOnlineRef = useRef(playersOnline);

  useEffect(() => {
    playersOnlineRef.current = playersOnline;
  }, [playersOnline]);

  useEffect(() => {
    const user = getUser();
    console.log("Current user:", user);
    if (user && user.id) {
      setCurrentUser(user);
      console.log("Authenticated user loaded:", user.username);
    } else {
      console.log("No authenticated user or guest user detected");
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (!gameId) return;

    // Connect and join game
    socketManager.connect();
    //socketManager.joinGame(gameId);
    // In the useEffect, replace the joinGame call:
    const urlParams = new URLSearchParams(window.location.search);
    const role =
      urlParams.get("choice") === "spectator" ? "spectator" : "player";
    socketManager.joinGame(gameId, null, role);

    // Set up event listeners
    socketManager.on(
      "assignColor",
      (assignedColor) => {
        console.log("Assigned color:", assignedColor);
        console.log("forcced color: " + forcedColor);
        if (!forcedColor) {
          setColor(assignedColor);
        }
      },
      "assignColor"
    );

    socketManager.on(
      "loadMoves",
      (moveHistory, gameStatus) => {
        console.log("loadMoves event triggered", moveHistory, gameStatus);
        if (moveHistory && moveHistory.length > 0) {
          const lastMove = moveHistory[moveHistory.length - 1];
          if (lastMove.fen) {
            chess.current.load(lastMove.fen);
            setFen(lastMove.fen);
            setTurn(chess.current.turn());
          }
          const moveList = moveHistory.map((m) => m.move);
          setMoves(moveList);
        }

        // Handle game status if provided
        if (gameStatus && gameStatus.winner) {
          setGameEnded(true);
          setGameResult({ winner: gameStatus.winner, reason: "previous_game" });
        }
      },
      "loadMoves"
    );

    socketManager.on(
      "opponentMove",
      ({ fen: newFen, move, currentTurn }) => {
        chess.current.load(newFen);
        setFen(newFen);
        setMoves((prev) => [...prev, move]);
        setTurn(chess.current.turn());
      },
      "opponentMove"
    );

    socketManager.on(
      "playerStatus",
      ({ playersOnline: online, players, spectatorsOnline }) => {
        setPlayersOnline(online);
        setOpponentOnline(online > 1);
        setSpectatorsOnline(spectatorsOnline || 0);
      },
      "playerStatus"
    );

    socketManager.on(
      "roomFull",
      () => {
        showToast("This game already has two players. Cannot join.", "error");
      },
      "roomFull"
    );

    socketManager.on(
      "gameEnded",
      async ({ winner, reason }) => {
        const result = { winner, reason: reason || "game_over" };
        setGameEnded(true);
        setGameResult(result);

        // Update user stats
        await updateGameStats(result);
      },
      "gameEnded"
    );

    socketManager.on(
      "drawOffer",
      ({ offeringPlayer }) => {
        setShowDrawOffer(true);
        setDrawOfferingPlayer(offeringPlayer);
      },
      "drawOffer"
    );

    socketManager.on(
      "drawRejected",
      () => {
        //alert("Your draw offer was rejected.");
        showToast("Your draw offer was rejected", "warning");
      },
      "drawRejected"
    );

    socketManager.on(
      "undoMoveRequest",
      ({ requestingPlayer }) => {
        setShowUndoRequest(true);
        setUndoRequestingPlayer(requestingPlayer);
      },
      "undoMoveRequest"
    );

    socketManager.on(
      "undoMoveRejected",
      () => {
        showToast("Your undo request was rejected", "warning");
      },
      "undoMoveRejected"
    );

    socketManager.on(
      "moveUndone",
      ({ newFen, newTurn, removedMove }) => {
        chess.current.load(newFen);
        setFen(newFen);
        setTurn(newTurn);
        setMoves((prev) => prev.slice(0, -1)); // Remove last move
        showToast("Move has been undone", "success");
      },
      "moveUndone"
    );

    socketManager.on(
      "undoMoveError",
      ({ message }) => {
        showToast(message, "error");
      },
      "undoMoveError"
    );

    socketManager.on(
      "assignRole",
      (role) => {
        setUserRole(role);
      },
      "assignRole"
    );

    // Cleanup function
    return () => {
      socketManager.removeAllListeners();
    };
  }, [gameId, forcedColor]);

  useEffect(() => {
    const fetchGameInfo = async () => {
      if (!gameId) return;

      try {
        const response = await fetch(`${serveruri}/game/${gameId}/status`);
        const data = await response.json();
        setGameInfo(data);

        // Set initial timer values for display
        if (data.time_limit && data.time_limit > 0) {
          const timeInSeconds = data.time_limit * 60;
          setWhiteTime(timeInSeconds);
          setBlackTime(timeInSeconds);
        } else {
          // Set to null for unlimited games
          setWhiteTime(null);
          setBlackTime(null);
        }
      } catch (error) {
        console.error("Error fetching game info:", error);
      }
    };

    fetchGameInfo();
  }, [gameId]);

  useEffect(() => {
    const handleTimerUpdate = ({ whiteTime, blackTime, currentTurn }) => {
      setWhiteTime(whiteTime);
      setBlackTime(blackTime);
      // Don't update turn here as it's handled by move logic
    };

    socketManager.on("timerUpdate", handleTimerUpdate, "timerUpdate");

    return () => {
      socketManager.off("timerUpdate");
    };
  }, []);

  useEffect(() => {
    const handleDrawAccepted = async () => {
      const result = { winner: "draw", reason: "agreement" };
      setGameEnded(true);
      setGameResult(result);
      await updateGameStats(result);
    };

    socketManager.on("drawAccepted", handleDrawAccepted, "drawAccepted");

    return () => {
      socketManager.off("drawAccepted");
    };
  }, [color, currentUser, userRole]);

  // useEffect(() => {
  //   if (!whiteTime || !blackTime || gameEnded || !gameInfo?.time_limit) return;

  //   const timer = setInterval(() => {
  //     if (turn === "w") {
  //       setWhiteTime((prev) => {
  //         if (prev <= 1) {
  //           socketManager.emit("timeUp", { gameId, loser: "white" });
  //           return 0;
  //         }
  //         return prev - 1;
  //       });
  //     } else {
  //       setBlackTime((prev) => {
  //         if (prev <= 1) {
  //           socketManager.emit("timeUp", { gameId, loser: "black" });
  //           return 0;
  //         }
  //         return prev - 1;
  //       });
  //     }
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [turn, whiteTime, blackTime, gameEnded, gameId, gameInfo]);

  function onDrop(sourceSquare, targetSquare) {
    if (userRole === "spectator") {
      showToast("Spectators cannot make moves!", "warning");
      return false;
    }
    if (!color) {
      showToast("Waiting for server to assign your color...", "info");
      return false;
    }

    if (gameEnded) {
      showToast("Game has ended!", "warning");
      return false;
    }

    // Check if it's player's turn
    if (
      (turn === "w" && color !== "white") ||
      (turn === "b" && color !== "black")
    ) {
      showToast("It&apos;s not your turn!", "warning");
      return false;
    }

    // Attempt the move
    const move = chess.current.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to queen for simplicity
    });

    if (move === null) {
      showToast("Invalid move", "error");
      return false;
    }

    // Update local state
    const newFen = chess.current.fen();
    setFen(newFen);
    setTurn(chess.current.turn());
    setMoves((prev) => [...prev, move.san]);

    // Track game history for undo functionality
    setGameHistory((prev) => [
      ...prev,
      {
        fen: chess.current.fen(),
        turn: chess.current.turn(),
        lastMove: move.san,
      },
    ]);

    // Check for checkmate or stalemate
    const isCheckmate = chess.current.isCheckmate();
    const isStalemate = chess.current.isStalemate();

    let winner = null;
    if (isCheckmate) {
      winner = color; // Current player wins
    } else if (isStalemate) {
      winner = "draw";
    }
    if (isCheckmate || isStalemate) {
      const result = {
        winner,
        reason: isCheckmate ? "checkmate" : "stalemate",
      };
      setTimeout(() => updateGameStats(result), 100);
    }

    // Emit move to server
    socketManager.makeMove(
      gameId,
      move.san,
      newFen,
      isCheckmate || isStalemate,
      winner,
      chess.current.turn()
    );

    if (moves.length === 0) {
      socketManager.emit("firstMove", gameId);
    }

    return true;
  }

  const handleSurrender = async () => {
    if (gameEnded) return;
    if (userRole === "spectator") {
      return;
    }

    if (confirm("Are you sure you want to surrender?")) {
      const result = {
        winner: color === "white" ? "black" : "white",
        reason: "surrender",
      };

      socketManager.surrenderGame(gameId, color);
      // Send system message to chat
      socketManager.sendChatMessage(
        gameId,
        "System",
        `${color === "white" ? "White" : "Black"} player surrendered`
      );
      setGameEnded(true);
      setGameResult(result);

      // Update user stats
      await updateGameStats(result);
    }
  };

  const handleOfferDraw = () => {
    if (gameEnded) return;
    if (userRole === "spectator") {
      return;
    }
    socketManager.emit("offerDraw", { gameId, offeringPlayer: color });
    //alert("Draw offer sent to opponent.");
    showToast("Draw offer sent to opponent", "info");
  };

  const handleDrawResponse = (accepted) => {
    if (userRole === "spectator") {
      return;
    }
    socketManager.emit("respondToDraw", { gameId, accepted });
    setShowDrawOffer(false);
    setDrawOfferingPlayer(null);
  };

  const handleRequestUndoMove = () => {
    if (gameEnded) return;
    if (userRole === "spectator") return;
    if (moves.length === 0) {
      showToast("No moves to undo", "warning");
      return;
    }

    socketManager.requestUndoMove(gameId, color);
    showToast("Undo request sent to opponent", "info");
  };

  const handleUndoResponse = (accepted) => {
    if (userRole === "spectator") return;

    let gameState = null;
    console.log("Undo accepted");
    if (accepted && gameHistory.length > 1) {
      console.log("Undo got here");
      // Get the previous game state (before the last move)
      gameState = gameHistory[gameHistory.length - 2];
      gameState.gameId = gameId;
      console.log(gameState);
    }

    socketManager.respondToUndoMove(gameId, accepted, gameState);
    setShowUndoRequest(false);
    setUndoRequestingPlayer(null);
  };

  const updateGameStats = async (gameResult) => {
    // Only update stats for authenticated users who are players
    if (!currentUser || userRole === "spectator" || !currentUser.id) {
      console.log("Skipping stats update - no authenticated user or spectator");
      return;
    }

    try {
      let result;
      if (gameResult.winner === "draw") {
        result = "draw";
      } else if (gameResult.winner === color) {
        result = "win";
      } else {
        result = "loss";
      }

      console.log(
        "Updating stats for user:",
        currentUser.username,
        "Result:",
        result
      );
      const updatedUser = await updateUserStats(result);

      if (updatedUser) {
        setCurrentUser(updatedUser); // Update current user state with new stats
        console.log("User stats updated successfully:", result);
      }
    } catch (error) {
      console.error("Error updating user stats:", error);
      // Don't show error to user as it's not critical for gameplay
    }
  };

  return (
    // <div style={{ maxWidth: 500, margin: "auto", position: "relative" }}>
    <div style={{ width: "100%", margin: "auto", position: "relative" }}>
      <ToastContainer />
      {/* Game Result Overlay */}
      {gameEnded && gameResult && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(0.5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            borderRadius: 8,
          }}
        >
          <div
            style={{
              backgroundColor: "#333",
              padding: "30px",
              borderRadius: "12px",
              textAlign: "center",
              color: "white",
              maxWidth: "300px",
            }}
          >
            <h2 style={{ margin: "0 0 15px 0", fontSize: "24px" }}>
              Game Over!
            </h2>
            <p style={{ margin: "0 0 20px 0", fontSize: "18px" }}>
              {gameResult.winner === "draw"
                ? "It&apos;s a Draw!"
                : gameResult.winner === color
                ? "You Won!"
                : "You Lost!"}
            </p>
            <p style={{ margin: "0 0 20px 0", fontSize: "14px", opacity: 0.8 }}>
              {gameResult.reason === "checkmate"
                ? "By Checkmate"
                : gameResult.reason === "surrender"
                ? "By Surrender"
                : "Game Ended"}
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                backgroundColor: "#20b155",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              New Game
            </button>
          </div>
        </div>
      )}

      {/* Draw Offer Modal */}
      {showDrawOffer && userRole === "player" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99,
            borderRadius: 8,
          }}
        >
          <div
            style={{
              backgroundColor: "#333",
              padding: "25px",
              borderRadius: "10px",
              textAlign: "center",
              color: "white",
              maxWidth: "280px",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0" }}>Draw Offer</h3>
            <p style={{ margin: "0 0 20px 0" }}>
              Your opponent is offering a draw. Do you accept?
            </p>
            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={() => handleDrawResponse(true)}
                style={{
                  backgroundColor: "#20b155",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Accept
              </button>
              <button
                onClick={() => handleDrawResponse(false)}
                style={{
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Move Request Modal */}
      {showUndoRequest && userRole === "player" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            borderRadius: 8,
          }}
        >
          <div
            style={{
              backgroundColor: "#333",
              padding: "25px",
              borderRadius: "10px",
              textAlign: "center",
              color: "white",
              maxWidth: "280px",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0" }}>Undo Move Request</h3>
            <p style={{ margin: "0 0 20px 0" }}>
              Your opponent wants to undo their last move. Do you allow it?
            </p>
            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={() => handleUndoResponse(true)}
                style={{
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Allow Undo
              </button>
              <button
                onClick={() => handleUndoResponse(false)}
                style={{
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div
        style={{
          marginBottom: 8,
          padding: 12,
          backgroundColor: "#1f2937",
          color: "white",
          borderRadius: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 16,
          border: "1px solid #374151",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Turn indicator */}
        <div>
          {gameEnded ? (
            <span style={{ fontWeight: "bold" }}>Game Ended</span>
          ) : color && turn === (color === "white" ? "w" : "b") ? (
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
              />
            </>
          ) : (
            <>
              <span style={{ fontWeight: "bold" }}>Opponent&apos;s turn</span>
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
              />
            </>
          )}
        </div>
        <div>
          {chess.current.isCheck() && (
            <span style={{ color: "red", marginLeft: 8, fontWeight: "bold" }}>
              CHECK!
            </span>
          )}
        </div>
        {/* Opponent status */}
        <div>
          Players online: {playersOnline}/2
          {/* Spectators Online: {spectatorsOnline} */}
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: opponentOnline ? "limegreen" : "red",
              marginLeft: 6,
            }}
            title={opponentOnline ? "Opponent Online" : "Waiting for opponent"}
          />
        </div>
      </div>
      {/* Invite Player message*/}
      {/* Invite Player Message - Add this right after the Status Bar and before Game Controls */}
      {!gameEnded && playersOnline === 1 && userRole === "player" && (
        <div
          style={{
            marginBottom: 12,
            padding: 16,
            backgroundColor: "#1e3a8a",
            color: "white",
            borderRadius: 8,
            textAlign: "center",
            border: "1px solid #3b82f6",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>
            Waiting for opponent to join...
          </p>
          <p style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
            Send this link to invite a player:
          </p>
          <div
            style={{
              backgroundColor: "#1e40af",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              wordBreak: "break-all",
              cursor: "pointer",
              border: "1px solid #3b82f6",
            }}
            onClick={() => {
              const inviteColor = color === "white" ? "black" : "white";
              const inviteLink = `${window.location.origin}/game/${gameId}?choice=${inviteColor}`;
              navigator.clipboard.writeText(inviteLink).then(() => {
                showToast("Invite link copied to clipboard!", "success");
              });
            }}
            title="Click to copy"
          >
            {`${window.location.origin}/game/${gameId}?choice=${
              color === "white" ? "black" : "white"
            }`}
          </div>
          <p style={{ margin: "8px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
            Click the link above to copy it
          </p>
        </div>
      )}

      {/* Game Controls */}
      {!gameEnded && playersOnline === 2 && userRole === "player" && (
        <div
          style={{
            marginBottom: 8,
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleOfferDraw}
            style={{
              backgroundColor: "#f59e0b",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#d97706")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#f59e0b")}
          >
            🤝 Offer Draw
          </button>
          <button
            onClick={handleRequestUndoMove}
            disabled={moves.length === 0}
            style={{
              backgroundColor: moves.length === 0 ? "#6b7280" : "#8b5cf6",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: moves.length === 0 ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              if (moves.length > 0) e.target.style.backgroundColor = "#7c3aed";
            }}
            onMouseOut={(e) => {
              if (moves.length > 0) e.target.style.backgroundColor = "#8b5cf6";
            }}
          >
            ↶ Request Undo
          </button>
          <button
            onClick={handleSurrender}
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#b91c1c")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#dc2626")}
          >
            🏳️ Surrender
          </button>
        </div>
      )}

      {userRole === "spectator" && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "10px",
            color: "#666",
            fontSize: "14px",
          }}
        >
          Watching as Spectator | Spectators Online: {spectatorsOnline}
        </div>
      )}

      {/* Chessboard */}
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        boardOrientation={color || "white"}
        arePiecesDraggable={!gameEnded && userRole === "player"}
        customBoardStyle={{
          borderRadius: "8px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          border: "2px solid #374151",
        }}
        customLightSquareStyle={
          boardStyle?.lightSquareStyle || { backgroundColor: "#f0d9b5" }
        }
        customDarkSquareStyle={
          boardStyle?.darkSquareStyle || { backgroundColor: "#b58863" }
        }
        // boardWidth={480}
        onPieceDragBegin={(sourceSquare, piece) => {
          const canDrag =
            playersOnlineRef.current === 2 &&
            !gameEnded &&
            userRole === "player";
          if (!canDrag) {
            //showToast("You cannot move the pieces.", "warning");
            alert("You cannot start game alone");
          }
          return canDrag; // prevents drag if false
        }}
      />

      {/* Moves History */}
      <div style={{ marginTop: 12, color: "white", textAlign: "center" }}>
        <p>Moves: {moves.join(", ")}</p>
      </div>
    </div>
  );
}
