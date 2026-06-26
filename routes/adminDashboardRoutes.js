const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getAdminDashboard,
  getAllAdminSongs,
} = require("../controllers/adminDashboardController");

const router = express.Router();

router.get("/dashboard", authMiddleware, getAdminDashboard);

router.get("/songs", authMiddleware, getAllAdminSongs);

module.exports = router;