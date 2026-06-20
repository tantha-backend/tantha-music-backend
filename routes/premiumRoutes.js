const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  subscribePremium,
  verifyPremiumPayment,
  getPremiumStatus,
} = require("../controllers/premiumController");

const router = express.Router();

router.post(
  "/subscribe",
  authMiddleware,
  subscribePremium
);

router.get(
  "/verify/:orderId",
  verifyPremiumPayment
);

router.get(
  "/status",
  authMiddleware,
  getPremiumStatus
);

module.exports = router;