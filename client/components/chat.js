"use client";

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001"); // Update if your server runs elsewhere

export default function Chat({ gameId, playerName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!gameId) return;

    // Join the game room on mount or when gameId changes
    socket.emit("joinGame", gameId);

    // Listen for chat messages
    socket.on("chatMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Clean up on unmount
    return () => {
      socket.off("chatMessage");
    };
  }, [gameId]);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() === "") return;

    const msg = { gameId, user: playerName || "You", text: input.trim() };
    socket.emit("chatMessage", msg);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] p-4 rounded-xl">
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 p-2 rounded ${
              msg.user === playerName || msg.user === "You"
                ? "bg-green-600 text-white self-end max-w-xs"
                : "bg-gray-700 text-gray-200 self-start max-w-xs"
            }`}
          >
            <strong>{msg.user}: </strong>
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow rounded px-3 py-2 bg-gray-900 text-white outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
