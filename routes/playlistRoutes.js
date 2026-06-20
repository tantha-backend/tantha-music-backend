const express = require("express");
const router = express.Router();

const {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist,
} = require("../controllers/playlistController");

const protect = require("../middleware/authMiddleware");

router.post("/create", protect, createPlaylist);
router.get("/me", protect, getMyPlaylists);

router.get("/:id", protect, getPlaylistById);

router.put("/:playlistId/add-song/:songId", protect, addSongToPlaylist);

router.delete(
  "/:playlistId/remove-song/:songId",
  protect,
  removeSongFromPlaylist
);

router.delete("/:id", protect, deletePlaylist);

module.exports = router;