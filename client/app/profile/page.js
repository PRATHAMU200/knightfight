"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Edit2,
  Save,
  X,
  Trophy,
  Target,
  Calendar,
  Star,
  TrendingUp,
  Award,
  Crown,
} from "lucide-react";
const serveruri = process.env.NEXT_PUBLIC_SERVER_API_URL;
const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [editData, setEditData] = useState({
    name: "",
    bio: "",
  });

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem("chess_token");
      if (!token) {
        setMessage({
          type: "error",
          text: "Please log in to view your profile",
        });
        setLoading(false);
        return;
      }

      const response = await fetch(serveruri + "/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditData({
          name: data.user.name,
          bio: data.user.bio || "",
        });
      } else {
        setMessage({ type: "error", text: "Failed to load profile data" });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setMessage({
        type: "error",
        text: "Network error while loading profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setEditData({
      name: user.name,
      bio: user.bio || "",
    });
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditData({
      name: user.name,
      bio: user.bio || "",
    });
  };

  const handleSave = async () => {
    if (!editData.name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }

    if (editData.name.length < 2 || editData.name.length > 100) {
      setMessage({
        type: "error",
        text: "Name must be between 2 and 100 characters",
      });
      return;
    }

    if (editData.bio.length > 500) {
      setMessage({
        type: "error",
        text: "Bio must be less than 500 characters",
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("chess_token");
      const response = await fetch(serveruri + "/api/auth/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editData.name.trim(),
          bio: editData.bio.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditMode(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });

        // Update localStorage
        localStorage.setItem("chess_user", JSON.stringify(data.user));
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.error || "Failed to update profile",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: "Network error while updating profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const getBadgeColor = (badge) => {
    const colors = {
      beginner: "bg-gray-500",
      bronze: "bg-orange-600",
      silver: "bg-gray-400",
      gold: "bg-yellow-500",
      platinum: "bg-blue-500",
      diamond: "bg-purple-500",
      master: "bg-red-500",
    };
    return colors[badge] || "bg-gray-500";
  };

  const getWinRate = () => {
    if (!user || user.total_games === 0) return 0;
    return Math.round((user.wins / user.total_games) * 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-400">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Player Profile
            </h1>
            <p className="text-gray-400 mt-2">
              Manage your chess profile and view your statistics
            </p>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-gray-800 rounded-xl p-8 mb-6 border border-gray-700">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-grow w-full">
              <div className="flex items-center gap-4 mb-4">
                {!editMode ? (
                  <>
                    <h2 className="text-3xl font-bold text-white">
                      {user.name}
                    </h2>
                    <button
                      onClick={handleEdit}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                      title="Edit Profile"
                    >
                      <Edit2 size={20} />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3 w-full">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="text-2xl font-bold bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none flex-grow"
                      placeholder="Your name"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50"
                      title="Save Changes"
                    >
                      <Save size={20} />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-all"
                      title="Cancel"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                <p className="text-blue-400 text-xl font-semibold">
                  @{user.username}
                </p>
                <p className="text-gray-400">{user.email}</p>
              </div>

              {/* Badge and Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <span
                    className={`px-4 py-2 rounded-lg text-white font-semibold ${getBadgeColor(
                      user.badge
                    )}`}
                  >
                    {user.badge.charAt(0).toUpperCase() + user.badge.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-400 font-bold text-lg">
                    Rating: {user.rating}
                  </span>
                </div>
              </div>

              {/* Bio Section */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">About</h3>
                {!editMode ? (
                  <p className="text-gray-300 leading-relaxed">
                    {user.bio || "No bio added yet. Click edit to add one!"}
                  </p>
                ) : (
                  <div>
                    <textarea
                      value={editData.bio}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      placeholder="Tell us about yourself..."
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                      rows="4"
                      maxLength="500"
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      {editData.bio.length}/500 characters
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Games */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Total Games</h3>
            </div>
            <p className="text-3xl font-bold text-blue-400">
              {user.total_games}
            </p>
          </div>

          {/* Wins */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Trophy className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Wins</h3>
            </div>
            <p className="text-3xl font-bold text-green-400">{user.wins}</p>
          </div>

          {/* Losses */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Losses</h3>
            </div>
            <p className="text-3xl font-bold text-red-400">{user.losses}</p>
          </div>

          {/* Win Rate */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Win Rate</h3>
            </div>
            <p className="text-3xl font-bold text-purple-400">
              {getWinRate()}%
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">
            Additional Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-4 bg-yellow-500/20 rounded-lg">
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <span className="text-gray-300 block mb-2">Draws</span>
              <p className="text-3xl font-bold text-yellow-400">{user.draws}</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-4 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <span className="text-gray-300 block mb-2">Current Rating</span>
              <p className="text-3xl font-bold text-blue-400">{user.rating}</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-4 bg-purple-500/20 rounded-lg">
                  <Calendar className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <span className="text-gray-300 block mb-2">Member Since</span>
              <p className="text-xl font-bold text-purple-400">
                {formatDate(user.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
