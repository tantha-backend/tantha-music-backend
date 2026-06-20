const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  createSong,
  getPublishedSongs,
  getTrendingSongs,
  searchSongs,
  getSongById,
  getSongsByArtist,
  playSong,
  likeSong,
  getLikedSongs,
  addSongToAlbum,
} = require("../controllers/songController");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.fields([
    { name: "audio128", maxCount: 1 },
    { name: "audio320", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  createSong
);

router.get("/", getPublishedSongs);

router.get("/trending/all", getTrendingSongs);

router.get("/search", searchSongs);

router.get("/artist/:artistId", getSongsByArtist);

router.get("/liked/me", authMiddleware, getLikedSongs);

router.put("/play/:id", playSong);

router.put("/like/:id", authMiddleware, likeSong);

router.put("/:songId/album/:albumId", authMiddleware, addSongToAlbum);

router.get("/:id", getSongById);

module.exports = router;