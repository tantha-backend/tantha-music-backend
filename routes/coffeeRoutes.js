const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  supportArtist,
  getArtistCoffeeSupports,
} = require("../controllers/coffeeController");

const router = express.Router();

router.post(
  "/support/:artistId",
  authMiddleware,
  supportArtist
);

router.get(
  "/artist/:artistId",
  authMiddleware,
  getArtistCoffeeSupports
);

module.exports = router;