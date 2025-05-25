import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Use the same pool configuration as your main server
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

// Initialize table if it doesn't exist
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      bio TEXT DEFAULT '',
      total_games INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      rating INTEGER DEFAULT 1200,
      badge VARCHAR(50) DEFAULT 'beginner',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
initDb();

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get fresh user data
    const result = await pool.query(
      "SELECT id, email, username, name, bio, total_games, wins, losses, draws, rating, badge, created_at FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Helper function to validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate username
const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Validation
    if (!name || !email || !username || !password) {
      return res.status(400).json({
        error: "All fields are required",
        details: {
          name: !name,
          email: !email,
          username: !username,
          password: !password,
        },
      });
    }

    if (name.length < 2 || name.length > 100) {
      return res
        .status(400)
        .json({ error: "Name must be between 2 and 100 characters" });
    }

    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ error: "Please enter a valid email address" });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        error:
          "Username must be 3-20 characters long and contain only letters, numbers, and underscores",
      });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email.toLowerCase(), username.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      const existing = await pool.query(
        "SELECT email, username FROM users WHERE email = $1 OR username = $2",
        [email.toLowerCase(), username.toLowerCase()]
      );

      const conflictField =
        existing.rows[0].email === email.toLowerCase() ? "email" : "username";
      return res.status(409).json({
        error: `An account with this ${conflictField} already exists`,
        field: conflictField,
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, username, password) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, username, name, total_games, wins, losses, draws, rating, badge, created_at`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        username.toLowerCase().trim(),
        hashedPassword,
      ]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        bio: "",
        total_games: user.total_games,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        rating: user.rating,
        badge: user.badge,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during registration" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res
        .status(400)
        .json({ error: "Email/username and password are required" });
    }

    // Find user by email or username
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $1",
      [emailOrUsername.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    const token = generateToken(user.id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        bio: user.bio,
        total_games: user.total_games,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        rating: user.rating,
        badge: user.badge,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// GET /api/auth/me - Get current user info
router.get("/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post("/logout", authenticateToken, (req, res) => {
  // Since we're using stateless JWT, logout is handled on the client side
  res.json({ message: "Logged out successfully" });
});

// GET /api/users/:id - Get user profile
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT id, username, name, bio, total_games, wins, losses, draws, rating, badge, created_at FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/profile - Update user profile
router.put("/users/profile", authenticateToken, async (req, res) => {
  try {
    const { name, bio } = req.body;
    const userId = req.user.id;

    // Validation
    if (name && (name.length < 2 || name.length > 100)) {
      return res
        .status(400)
        .json({ error: "Name must be between 2 and 100 characters" });
    }

    if (bio && bio.length > 500) {
      return res
        .status(400)
        .json({ error: "Bio must be less than 500 characters" });
    }

    // Update user
    const result = await pool.query(
      "UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio) WHERE id = $3 RETURNING id, email, username, name, bio, total_games, wins, losses, draws, rating, badge, created_at",
      [name?.trim(), bio?.trim(), userId]
    );

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/stats - Update user game stats (for internal use)
router.put("/users/stats", authenticateToken, async (req, res) => {
  try {
    const { total_games, wins, losses, draws, rating } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE users SET 
        total_games = COALESCE($1, total_games),
        wins = COALESCE($2, wins),
        losses = COALESCE($3, losses),
        draws = COALESCE($4, draws),
        rating = COALESCE($5, rating)
       WHERE id = $6 
       RETURNING id, username, name, total_games, wins, losses, draws, rating, badge`,
      [total_games, wins, losses, draws, rating, userId]
    );

    res.json({
      message: "Stats updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/leaderboard - Get top players
router.get("/users/leaderboard", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const result = await pool.query(
      "SELECT id, username, name, rating, total_games, wins, losses, draws, badge FROM users WHERE total_games > 0 ORDER BY rating DESC, wins DESC LIMIT $1",
      [limit]
    );

    res.json({ leaderboard: result.rows });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
