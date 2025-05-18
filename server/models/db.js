const { Pool } = require("pg");

// Create a pool of connections to PostgreSQL
const pool = new Pool({
  user: "postgres", // Replace with your PostgreSQL username
  host: "localhost", // Host where PostgreSQL is running
  database: "knightfight", // Database name
  password: "root", // Replace with your PostgreSQL password
  port: 5432, // Default PostgreSQL port
});

// Optional: To check if connected successfully
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  console.log("PostgreSQL connected successfully.");
  release();
});

module.exports = pool;
