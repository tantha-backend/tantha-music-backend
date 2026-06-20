const express = require("express");

const { getHomeFeed } = require("../controllers/homeController");

const router = express.Router();

router.get("/", getHomeFeed);

module.exports = router;