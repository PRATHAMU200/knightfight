import React, { useState, useRef, useEffect } from "react";

export default function Chat({ gameId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);
  const chatEndRef = useRef(null);

  // Scroll chat to bottom on new message
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Close menu if click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    }
    if (menuOpenId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpenId]);

  function toggleMenu(id) {
    setMenuOpenId(menuOpenId === id ? null : id);
  }

  function deleteMessage(id) {
    setMessages(messages.filter((msg) => msg.id !== id));
    setMenuOpenId(null);
  }

  function reportMessage(id) {
    alert(`Reported message ${id}`);
    setMenuOpenId(null);
  }

  function sendMessage() {
    if (input.trim() === "") return;
    const newMsg = {
      id: Date.now(),
      user: "You",
      text: input.trim(),
    };
    setMessages([...messages, newMsg]);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col bg-[#0e0e0e] border border-gray-700 rounded-xl p-4 h-full max-h-[600px]">
      <h2 className="text-lg font-semibold mb-4 text-white">Chat</h2>
      <div
        className="flex-1 overflow-y-auto space-y-4 mb-4 scroll-container"
        ref={scrollContainerRef}
      >
        {messages.map((msg) => (
          <div key={msg.id} className="relative group">
            <div className="flex justify-between items-start">
              <div className="text-gray-300 break-words whitespace-normal max-w-[90%]">
                <strong className="text-[#20b155]">{msg.user}:</strong>{" "}
                {msg.text}
              </div>
              {/* Menu button */}
              <button
                onClick={() => toggleMenu(msg.id)}
                className="text-gray-500 hover:text-white ml-2 focus:outline-none"
                aria-label="Open menu"
              >
                &#8942;
              </button>
            </div>

            {/* Dropdown menu */}
            {menuOpenId === msg.id && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-1 w-28 bg-gray-800 rounded shadow-lg z-10"
                style={{ top: "100%" }}
              >
                <button
                  onClick={() => reportMessage(msg.id)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  Report
                </button>
                <button
                  onClick={() => deleteMessage(msg.id)}
                  className="block w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Message input box */}
      <div className="flex space-x-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 resize-none rounded-md p-2 bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={2}
        />
        <button
          type="button"
          onClick={sendMessage}
          className="bg-green-600 hover:bg-green-700 rounded-md px-4 py-2 text-white font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
}
