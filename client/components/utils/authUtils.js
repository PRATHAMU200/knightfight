// authUtils.js - Frontend utility functions for authentication
const serveruri = process.env.NEXT_PUBLIC_SERVER_API_URL;
export const AUTH_STORAGE_KEY = "chess_token";
export const USER_STORAGE_KEY = "chess_user";

// Get authentication token
export const getAuthToken = () => {
  return localStorage.getItem(AUTH_STORAGE_KEY);
};

// Get user data from localStorage
export const getUser = () => {
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getUser();
  return !!(token && user);
};

// Store authentication data
export const setAuthData = (token, user) => {
  localStorage.setItem(AUTH_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  // Set cookie as well
  document.cookie = `chess_auth=${token}; path=/; max-age=${
    7 * 24 * 60 * 60
  }; secure; samesite=strict`;
};

// Clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);

  // Clear cookie
  document.cookie =
    "chess_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
};

// API request with authentication
export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("No authentication token available");
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include",
  };

  const response = await fetch(url, config);

  // Handle token expiration
  if (response.status === 401 || response.status === 403) {
    clearAuthData();
    // You might want to redirect to login or show a message
    throw new Error("Authentication expired. Please log in again.");
  }

  return response;
};

// Update user stats after a game
export const updateUserStats = async (gameResult) => {
  try {
    const user = getUser();
    if (!user || !user.id) {
      console.log("No authenticated user found, skipping stats update");
      return null;
    }

    const updatedStats = {
      total_games: (user.total_games || 0) + 1,
      wins: (user.wins || 0) + (gameResult === "win" ? 1 : 0),
      losses: (user.losses || 0) + (gameResult === "loss" ? 1 : 0),
      draws: (user.draws || 0) + (gameResult === "draw" ? 1 : 0),
    };

    console.log("Updating stats for user:", user.username, updatedStats);

    const response = await authenticatedFetch(
      serveruri + "/api/auth/users/stats",
      {
        method: "PUT",
        body: JSON.stringify(updatedStats),
      }
    );

    if (response.ok) {
      const data = await response.json();
      // Update localStorage with new stats
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      console.log("Stats updated successfully:", updatedUser);
      return updatedUser;
    } else {
      console.error(
        "Failed to update stats:",
        response.status,
        response.statusText
      );
      return null;
    }
  } catch (error) {
    console.error("Error updating user stats:", error);
    if (error.message.includes("Authentication expired")) {
      // Handle auth expiry gracefully
      console.log("Authentication expired, user will need to log in again");
    }
    return null;
  }
};

// Logout function
export const logout = async () => {
  try {
    // Call logout endpoint if needed
    await authenticatedFetch(serveruri + "/api/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearAuthData();
    // Redirect to login or home page
    window.location.href = "/login";
  }
};

// Check if token is expired (basic check)
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Refresh user data from server
export const refreshUserData = async () => {
  try {
    const response = await authenticatedFetch(serveruri + "/api/auth/me");
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      return data.user;
    }
  } catch (error) {
    console.error("Error refreshing user data:", error);
    return null;
  }
};
