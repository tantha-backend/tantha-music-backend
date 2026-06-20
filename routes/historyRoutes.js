const express = require("express");
const router = express.Router();

const {
  getRecentHistory,
  getAllHistory,
  clearHistory,
} = require("../controllers/historyController");

const protect = require("../middleware/authMiddleware");

router.get("/recent", protect, getRecentHistory);
router.get("/me", protect, getAllHistory);
router.delete("/clear", protect, clearHistory);

module.exports = router;