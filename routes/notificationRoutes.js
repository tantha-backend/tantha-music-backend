const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  getAdminNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);

router.get("/", getAdminNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.put("/read-all", markAllNotificationsAsRead);
router.put("/:id/read", markNotificationAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
