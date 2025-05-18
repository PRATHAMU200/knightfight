const express = require("express");
const router = express.Router();
const matchController = require("../controllers/matchcontroller");

router.post("/start", matchController.startMatch);

module.exports = router;
