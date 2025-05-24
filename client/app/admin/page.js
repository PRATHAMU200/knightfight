"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, CheckSquare, XCircle } from "lucide-react";
import dotenv from "dotenv";
dotenv.config();
export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [games, setGames] = useState([]);
  const [selectedGames, setSelectedGames] = useState([]);
  const [stats, setStats] = useState({ totalGames: 0 });

  const adminUser = process.env.NEXT_PUBLIC_ADMIN_USER;
  const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASS;
  const serveruri = process.env.NEXT_PUBLIC_SERVER_API_URL;
  const fetchGames = async () => {
    try {
      const res = await axios.get(serveruri + "/api/admin/games");
      setGames(res.data.games);
      setStats({ totalGames: res.data.games.length });
    } catch (err) {
      console.error("Error fetching games:", err);
    }
  };

  const handleLogin = () => {
    if (username === adminUser && password === adminPass) {
      setIsLoggedIn(true);
      fetchGames();
    } else {
      alert("Invalid credentials");
    }
  };

  const toggleSelect = (gameId) => {
    setSelectedGames((prev) =>
      prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId]
    );
  };

  const deleteGame = async (gameId) => {
    await axios.delete(serveruri + `/api/admin/games/${gameId}`);
    fetchGames();
  };

  const deleteSelected = async () => {
    await Promise.all(
      selectedGames.map((id) =>
        axios.delete(serveruri + `/api/admin/games/${id}`)
      )
    );
    setSelectedGames([]);
    fetchGames();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-80">
          <h2 className="text-2xl font-bold mb-4 text-center">Admin Login</h2>
          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-2 mb-3 bg-gray-700 rounded text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 mb-3 bg-gray-700 rounded text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-green-600 hover:bg-green-700 py-2 rounded text-white font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">📊 Stats</h2>
        <p>Total Games: {stats.totalGames}</p>
        {/* Add more stats like total players, active games etc. */}
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">🎮 All Games</h2>
        {selectedGames.length > 0 && (
          <button
            onClick={deleteSelected}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Delete Selected</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="p-3">Select</th>
              <th className="p-3">Game ID</th>
              <th className="p-3">is_private</th>
              <th className="p-3">created_at</th>
              <th className="p-3">time_control</th>
              <th className="p-3">time_limit</th>
              <th className="p-3">Winner</th>
              <th className="p-3">Started At</th>
              {/* <th className="p-3">Status</th> */}
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.game_id} className="border-t border-gray-700">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedGames.includes(game.game_id)}
                    onChange={() => toggleSelect(game.game_id)}
                    className="accent-green-500"
                  />
                </td>
                <td className="p-3">{game.game_id}</td>
                <td className="p-3">{game.is_private || "N/A"}</td>
                <td className="p-3">{game.created_at || "N/A"}</td>
                <td className="p-3">{game.time_control || "N/A"}</td>
                <td className="p-3">{game.time_limit || "N/A"}</td>
                <td className="p-3">{game.winner || "N/A"}</td>
                <td className="p-3">
                  {(game.timer_started && "Ongoing") || "No Started"}
                </td>
                {/* <td className="p-3">{game.status || "Ongoing"}</td> */}
                <td className="p-3">
                  <button
                    onClick={() => deleteGame(game.game_id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XCircle size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
