const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getAdminDashboard,
  getAllAdminSongs,
  getPendingSongs,
  approveSong,
  rejectSong,
} = require("../controllers/adminDashboardController");

const router = express.Router();

router.get("/dashboard", authMiddleware, getAdminDashboard);

router.get("/songs", authMiddleware, getAllAdminSongs);

router.get("/songs/pending", authMiddleware, getPendingSongs);

router.put("/songs/:id/approve", authMiddleware, approveSong);

router.put("/songs/:id/reject", authMiddleware, rejectSong);

module.exports = router;