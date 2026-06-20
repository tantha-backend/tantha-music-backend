const express = require("express");
const authMiddleware =
  require("../middleware/authMiddleware");

const {
  getAdminDashboard,
} = require("../controllers/adminDashboardController");

const router = express.Router();

router.get(
  "/dashboard",
  authMiddleware,
  getAdminDashboard
);

module.exports = router;