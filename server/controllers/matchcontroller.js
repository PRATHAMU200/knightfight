const matchModel = require("../models/matchModel");

async function startMatch(req, res) {
  try {
    const matchData = await matchModel.createMatch();
    res.json(matchData);
  } catch (err) {
    res.status(500).json({ error: "Failed to create match" });
  }
}

module.exports = { startMatch };
