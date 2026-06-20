const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  subscribeToArtist,
  getMySubscriptions,
  getArtistSubscribers,
} = require("../controllers/fanClubController");

const router = express.Router();

router.post(
  "/subscribe/:artistId",
  authMiddleware,
  subscribeToArtist
);

router.get(
  "/my-subscriptions",
  authMiddleware,
  getMySubscriptions
);

router.get(
  "/artist/:artistId",
  authMiddleware,
  getArtistSubscribers
);

module.exports = router;