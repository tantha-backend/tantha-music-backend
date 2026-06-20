const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getPendingSongs,
  approveSong,
  rejectSong,
} = require("../controllers/adminController");

router.get("/pending-songs", authMiddleware, adminMiddleware, getPendingSongs);

router.put("/approve-song/:id", authMiddleware, adminMiddleware, approveSong);

router.delete("/reject-song/:id", authMiddleware, adminMiddleware, rejectSong);

module.exports = router;