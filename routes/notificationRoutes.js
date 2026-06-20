const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getMyNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");

router.get("/me", protect, getMyNotifications);

router.put("/:id/read", protect, markNotificationAsRead);

module.exports = router;