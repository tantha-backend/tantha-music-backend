const Playlist = require("../../models/Playlist");
const Song = require("../../models/Song");
const User = require("../../models/User");

const notificationController = require("../notificationController");

const createNotification =
  notificationController.createNotification || (async () => null);

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "")
    return defaultValue;
  return value === true || value === "true";
};

const populatePlaylist = (query) =>
  query
    .populate("userId", "name email role profileImage")
    .populate("createdBy", "name email role profileImage")
    .populate(
      "songs",
      "title artistId coverImage audio128 audio320 duration genre language isPublished status playCount likeCount",
    );

const getCoverImage = (req) => {
  return (
    req.files?.coverImage?.[0]?.location ||
    req.files?.cover?.[0]?.location ||
    req.files?.coverImage?.[0]?.path ||
    req.files?.cover?.[0]?.path ||
    ""
  );
};

const getAdminPlaylists = async (req, res) => {
  try {
    const {
      search = "",
      visibility = "all",
      featured = "all",
      admin = "all",
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (search.trim()) {
      query.$text = { $search: search.trim() };
    }

    if (visibility !== "all") {
      query.isPublic = visibility === "public";
    }

    if (featured !== "all") {
      query.isFeatured = featured === "true";
    }

    if (admin !== "all") {
      query.createdByAdmin = admin === "true";
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    const [playlists, total] = await Promise.all([
      Playlist.find(query)
        .populate("userId", "name email role profileImage")
        .populate("createdBy", "name email role profileImage")
        .populate("songs", "title duration genre language isPublished status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Playlist.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: playlists.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      playlists,
    });
  } catch (error) {
    console.error("Get admin playlists error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch playlists",
      error: error.message,
    });
  }
};

const getAdminPlaylistById = async (req, res) => {
  try {
    const playlist = await populatePlaylist(Playlist.findById(req.params.id));

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
    console.error("Get admin playlist by id error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch playlist",
      error: error.message,
    });
  }
};

const createAdminPlaylist = async (req, res) => {
  try {
    const {
      title,
      description,
      userId,
      isPublic,
      createdByAdmin,
      isFeatured,
      playCount,
      followerCount,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Playlist title is required",
      });
    }

    let ownerId = userId;

    if (!ownerId && req.user?.id) {
      ownerId = req.user.id;
    }

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Playlist owner is required",
      });
    }

    const owner = await User.findById(ownerId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Playlist owner not found",
      });
    }

    const playlist = await Playlist.create({
      title: title.trim(),
      description: description?.trim() || "",
      coverImage: getCoverImage(req),
      userId: ownerId,
      createdBy: req.user?.id || ownerId,
      createdByAdmin: toBoolean(createdByAdmin, true),
      isPublic: toBoolean(isPublic, true),
      isFeatured: toBoolean(isFeatured, false),
      playCount: Number(playCount) || 0,
      followerCount: Number(followerCount) || 0,
    });

    const populatedPlaylist = await populatePlaylist(
      Playlist.findById(playlist._id),
    );

    await createNotification({
      userId: null,
      title: "New playlist created",
      message: `${populatedPlaylist.title} playlist has been created.`,
      type: "playlist",
      targetType: "playlist",
      targetId: populatedPlaylist._id,
      link: `/playlists/${populatedPlaylist._id}`,
    });

    res.status(201).json({
      success: true,
      message: "Playlist created successfully",
      playlist: populatedPlaylist,
    });
  } catch (error) {
    console.error("Create admin playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create playlist",
      error: error.message,
    });
  }
};

const updateAdminPlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const oldTitle = playlist.title;

    const {
      title,
      description,
      userId,
      isPublic,
      createdByAdmin,
      isFeatured,
      playCount,
      followerCount,
    } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Playlist title cannot be empty",
        });
      }

      playlist.title = title.trim();
    }

    if (description !== undefined) {
      playlist.description = description?.trim() || "";
    }

    if (userId !== undefined && userId !== playlist.userId.toString()) {
      const owner = await User.findById(userId);

      if (!owner) {
        return res.status(404).json({
          success: false,
          message: "Playlist owner not found",
        });
      }

      playlist.userId = userId;
    }

    const newCoverImage = getCoverImage(req);

    if (newCoverImage) {
      playlist.coverImage = newCoverImage;
    }

    if (isPublic !== undefined) {
      playlist.isPublic = toBoolean(isPublic, playlist.isPublic);
    }

    if (createdByAdmin !== undefined) {
      playlist.createdByAdmin = toBoolean(
        createdByAdmin,
        playlist.createdByAdmin,
      );
    }

    if (isFeatured !== undefined) {
      playlist.isFeatured = toBoolean(isFeatured, playlist.isFeatured);
    }

    if (playCount !== undefined) {
      playlist.playCount = Math.max(Number(playCount) || 0, 0);
    }

    if (followerCount !== undefined) {
      playlist.followerCount = Math.max(Number(followerCount) || 0, 0);
    }

    await playlist.save();

    const updatedPlaylist = await populatePlaylist(
      Playlist.findById(playlist._id),
    );

    await createNotification({
      userId: null,
      title: "Playlist updated",
      message: `${oldTitle} playlist has been updated.`,
      type: "playlist",
      targetType: "playlist",
      targetId: updatedPlaylist._id,
      link: `/playlists/${updatedPlaylist._id}`,
    });

    res.status(200).json({
      success: true,
      message: "Playlist updated successfully",
      playlist: updatedPlaylist,
    });
  } catch (error) {
    console.error("Update admin playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update playlist",
      error: error.message,
    });
  }
};

const deleteAdminPlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const playlistTitle = playlist.title;

    await Playlist.findByIdAndDelete(req.params.id);

    await createNotification({
      userId: null,
      title: "Playlist deleted",
      message: `${playlistTitle} playlist has been deleted.`,
      type: "playlist",
      targetType: "playlist",
      targetId: null,
      link: "/playlists",
    });

    res.status(200).json({
      success: true,
      message: "Playlist deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete playlist",
      error: error.message,
    });
  }
};

const makePlaylistPublic = async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      {
        isPublic: true,
      },
      {
        returnDocument: "after",
      },
    );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const populatedPlaylist = await populatePlaylist(
      Playlist.findById(playlist._id),
    );

    await createNotification({
      userId: null,
      title: "Playlist made public",
      message: `${populatedPlaylist.title} is now public.`,
      type: "playlist",
      targetType: "playlist",
      targetId: populatedPlaylist._id,
      link: `/playlists/${populatedPlaylist._id}`,
    });

    res.status(200).json({
      success: true,
      message: "Playlist is now public",
      playlist: populatedPlaylist,
    });
  } catch (error) {
    console.error("Make playlist public error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update playlist",
      error: error.message,
    });
  }
};

const makePlaylistPrivate = async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      {
        isPublic: false,
      },
      {
        returnDocument: "after",
      },
    );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const populatedPlaylist = await populatePlaylist(
      Playlist.findById(playlist._id),
    );

    await createNotification({
      userId: null,
      title: "Playlist made private",
      message: `${populatedPlaylist.title} is now private.`,
      type: "playlist",
      targetType: "playlist",
      targetId: populatedPlaylist._id,
      link: `/playlists/${populatedPlaylist._id}`,
    });

    res.status(200).json({
      success: true,
      message: "Playlist is now private",
      playlist: populatedPlaylist,
    });
  } catch (error) {
    console.error("Make playlist private error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update playlist",
      error: error.message,
    });
  }
};

const addSongToPlaylist = async (req, res) => {
  try {
    const { songId } = req.body || {};

    if (!songId) {
      return res.status(400).json({
        success: false,
        message: "Song ID is required",
      });
    }

    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const song = await Song.findById(songId);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    const exists = playlist.songs.some((id) => id.toString() === songId);

    if (!exists) {
      playlist.songs.push(songId);
      await playlist.save();

      await createNotification({
        userId: null,
        title: "Song added to playlist",
        message: `${song.title} has been added to ${playlist.title}.`,
        type: "playlist",
        targetType: "playlist",
        targetId: playlist._id,
        link: `/playlists/${playlist._id}`,
      });
    }

    const updatedPlaylist = await populatePlaylist(
      Playlist.findById(playlist._id),
    );

    res.status(200).json({
      success: true,
      message: exists
        ? "Song already exists in playlist"
        : "Song added successfully",
      playlist: updatedPlaylist,
    });
  } catch (error) {
    console.error("Add song to playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add song to playlist",
      error: error.message,
    });
  }
};

const removeSongFromPlaylist = async (req, res) => {
  try {
    const { songId } = req.body || {};

    if (!songId) {
      return res.status(400).json({
        success: false,
        message: "Song ID is required",
      });
    }

    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const song = await Song.findById(songId);
    const existed = playlist.songs.some((id) => id.toString() === songId);

    playlist.songs = playlist.songs.filter((id) => id.toString() !== songId);

    await playlist.save();

    if (existed) {
      await createNotification({
        userId: null,
        title: "Song removed from playlist",
        message: `${song?.title || "A song"} has been removed from ${
          playlist.title
        }.`,
        type: "playlist",
        targetType: "playlist",
        targetId: playlist._id,
        link: `/playlists/${playlist._id}`,
      });
    }

    const updatedPlaylist = await populatePlaylist(
      Playlist.findById(playlist._id),
    );

    res.status(200).json({
      success: true,
      message: "Song removed successfully",
      playlist: updatedPlaylist,
    });
  } catch (error) {
    console.error("Remove song from playlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove song from playlist",
      error: error.message,
    });
  }
};

const getPlaylistAnalytics = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate(
      "songs",
      "title duration playCount likeCount isPublished status",
    );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const songs = playlist.songs || [];

    const totalDuration = songs.reduce(
      (total, song) => total + (Number(song.duration) || 0),
      0,
    );

    const totalPlays = songs.reduce(
      (total, song) => total + (Number(song.playCount) || 0),
      0,
    );

    const totalLikes = songs.reduce(
      (total, song) => total + (Number(song.likeCount) || 0),
      0,
    );

    const publishedSongs = songs.filter(
      (song) => song.isPublished || song.status === "published",
    ).length;

    const analytics = {
      playlistId: playlist._id,
      title: playlist.title,
      totalSongs: songs.length,
      publishedSongs,
      totalDuration,
      totalPlays,
      totalLikes,
      playlistPlayCount: playlist.playCount || 0,
      followerCount: playlist.followerCount || 0,
      isPublic: playlist.isPublic,
      isFeatured: playlist.isFeatured,
      createdByAdmin: playlist.createdByAdmin,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };

    res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Get playlist analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch playlist analytics",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminPlaylists,
  getAdminPlaylistById,
  createAdminPlaylist,
  updateAdminPlaylist,
  deleteAdminPlaylist,
  makePlaylistPublic,
  makePlaylistPrivate,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getPlaylistAnalytics,
};