const express = require("express");
const authMiddleware = require("../../middleware/authMiddleware");
const adminMiddleware = require("../../middleware/adminMiddleware");

const {
  getAdminDashboard,
} = require("../../controllers/admin/dashboardController");

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getAdminDashboard);

module.exports = router;
