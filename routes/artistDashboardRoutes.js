const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getMyArtistDashboard,
} = require("../controllers/artistDashboardController");

const router = express.Router();

router.get("/me", authMiddleware, getMyArtistDashboard);

module.exports = router;