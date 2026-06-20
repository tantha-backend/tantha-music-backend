const express = require("express");

const {
  searchArtists,
  getTrendingArtists,
} = require("../controllers/artistSearchController");

const router = express.Router();

router.get("/search", searchArtists);

router.get("/trending", getTrendingArtists);

module.exports = router;