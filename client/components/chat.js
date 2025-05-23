"use client";

import React, { useState, useEffect, useRef } from "react";
import socketManager from "@/components/utils/socketManager";

export default function Chat({
  gameId,
  playerName,
  gameEnded,
  isSpectator = false,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log("Chat component mounted for game:", gameId);
    if (!gameId) return;

    // Set up chat event listeners
    socketManager.on(
      "loadChat",
      (chatMessages) => {
        console.log("Loading previous chat messages:", chatMessages);
        const formatted = chatMessages.map(
          ({ sender, message, created_at }) => ({
            user: sender,
            text: message,
            timestamp: created_at,
          })
        );
        setMessages(formatted);
      },
      "loadChat"
    );

    socketManager.on(
      "chatMessage",
      (msg) => {
        console.log("Received new chat message:", msg);
        setMessages((prev) => [
          ...prev,
          { ...msg, timestamp: new Date().toISOString() },
        ]);
      },
      "chatMessage"
    );

    // Cleanup function
    return () => {
      // Remove only chat-specific listeners
      socketManager.off("loadChat");
      socketManager.off("chatMessage");
    };
  }, [gameId]);

  // useEffect(() => {
  //   // Scroll to bottom on new message
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);
  // Scroll chat to bottom on new message
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() === "" || !gameId) return;

    const messageData = {
      gameId,
      user: playerName || "Anonymous",
      text: input.trim(),
    };

    console.log("Sending message:", messageData);
    socketManager.sendChatMessage(gameId, messageData.user, messageData.text);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] p-4 rounded-xl">
      <h3 className="text-white font-semibold mb-4">Game Chat</h3>

      <div
        className="flex-grow overflow-y-auto mb-4 space-y-2 max-h-96 scroll-container"
        ref={scrollContainerRef}
      >
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg max-w-xs break-words ${
                msg.user === playerName || msg.user === "You"
                  ? "bg-green-600 text-white self-end ml-auto"
                  : "bg-gray-700 text-gray-200 self-start mr-auto"
              }`}
            >
              <div className="text-xs opacity-75 mb-1">{msg.user}</div>
              <div>{msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow rounded px-3 py-2 bg-gray-900 text-white outline-none border border-gray-600 focus:border-green-500"
          disabled={!gameId || gameEnded || isSpectator}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !gameId || gameEnded || isSpectator}
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
