const Playlist = require("../models/Playlist");
const Song = require("../models/Song");

const createPlaylist = async (req, res) => {
  try {
    const { title, description, coverImage, isPublic } = req.body;

    const playlist = await Playlist.create({
      title,
      description,
      coverImage,
      isPublic,
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Playlist created successfully",
      playlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Playlist creation failed",
      error: error.message,
    });
  }
};

const getMyPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: playlists.length,
      playlists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch playlists",
      error: error.message,
    });
  }
};

const getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate("userId", "name email")
      .populate({
        path: "songs",
        select:
          "title artistId coverImage audio64 audio128 audio320 duration genre language playCount likeCount isPremiumOnly isPublished",
        populate: {
          path: "artistId",
          select: "stageName profileImage isVerified",
        },
      });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    res.status(200).json({
      success: true,
      playlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch playlist",
      error: error.message,
    });
  }
};

const addSongToPlaylist = async (req, res) => {
  try {
    const { playlistId, songId } = req.params;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this playlist",
      });
    }

    const song = await Song.findById(songId);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    const alreadyAdded = playlist.songs.some(
      (id) => id.toString() === songId
    );

    if (alreadyAdded) {
      return res.status(400).json({
        success: false,
        message: "Song already exists in playlist",
      });
    }

    playlist.songs.push(songId);

    await playlist.save();

    res.status(200).json({
      success: true,
      message: "Song added to playlist successfully",
      playlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add song to playlist",
      error: error.message,
    });
  }
};

const removeSongFromPlaylist = async (req, res) => {
  try {
    const { playlistId, songId } = req.params;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this playlist",
      });
    }

    playlist.songs = playlist.songs.filter(
      (id) => id.toString() !== songId
    );

    await playlist.save();

    res.status(200).json({
      success: true,
      message: "Song removed from playlist successfully",
      playlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove song from playlist",
      error: error.message,
    });
  }
};

const deletePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this playlist",
      });
    }

    await playlist.deleteOne();

    res.status(200).json({
      success: true,
      message: "Playlist deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete playlist",
      error: error.message,
    });
  }
};

module.exports = {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist,
};