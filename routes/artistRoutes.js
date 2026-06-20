const express = require("express");
const router = express.Router();

const {
  createArtistProfile,
  updateMyArtistProfile,
  followArtist,
  getFollowingArtists,
  getArtistProfile,
} = require("../controllers/artistController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post(
  "/create",
  protect,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  createArtistProfile
);

router.put(
  "/update/me",
  protect,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateMyArtistProfile
);

router.put("/follow/:artistId", protect, followArtist);

router.get("/following/me", protect, getFollowingArtists);

router.get("/profile/:artistId", protect, getArtistProfile);

module.exports = router;