const express = require("express");

const authMiddleware =
  require("../middleware/authMiddleware");

const {
  getRecommendedSongs,
} = require("../controllers/recommendationController");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  getRecommendedSongs
);

module.exports = router;