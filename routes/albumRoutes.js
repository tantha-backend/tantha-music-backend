const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  createAlbum,
  getAlbums,
  getAlbumById,
  getAlbumSongs,
} = require("../controllers/albumController");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
  ]),
  createAlbum
);

router.get("/", getAlbums);

router.get("/:id", getAlbumById);

router.get("/:id/songs", getAlbumSongs);

module.exports = router;