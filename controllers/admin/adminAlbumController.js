const Album = require("../../models/Album");
const Artist = require("../../models/Artist");
const Song = require("../../models/Song");

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "")
    return defaultValue;
  return value === true || value === "true";
};

const populateAlbum = (query) =>
  query
    .populate("artistId", "stageName artistName profileImage")
    .populate("songs");

const getAdminAlbums = async (req, res) => {
  try {
    const albums = await Album.find()
      .populate("artistId", "stageName artistName profileImage")
      .populate("songs", "title duration genre language isPublished status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: albums.length,
      albums,
    });
  } catch (error) {
    console.error("Get admin albums error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch albums",
      error: error.message,
    });
  }
};

const getAdminAlbumById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate("artistId", "stageName artistName profileImage bio")
      .populate("songs");

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    res.status(200).json({
      success: true,
      album,
    });
  } catch (error) {
    console.error("Get admin album by id error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch album",
      error: error.message,
    });
  }
};

const createAdminAlbum = async (req, res) => {
  try {
    const {
      title,
      artistId,
      description,
      genre,
      language,
      releaseDate,
      labelName,
      copyrightLine,
      isPublished,
      status,
      isPremiumOnly,
      isFeatured,
      isCoffeeSupportEnabled,
      isFanClubExclusive,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Album title is required",
      });
    }

    if (!artistId) {
      return res.status(400).json({
        success: false,
        message: "Artist is required",
      });
    }

    const artist = await Artist.findById(artistId);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const published = toBoolean(isPublished, false);

    const album = await Album.create({
      title: title.trim(),
      artistId,
      coverImage: req.files?.coverImage?.[0]?.location || "",
      bannerImage: req.files?.bannerImage?.[0]?.location || "",
      description: description?.trim() || "",
      genre: genre?.trim() || "",
      language: language?.trim() || "",
      releaseDate: releaseDate || Date.now(),
      labelName: labelName?.trim() || "Tantha Music",
      copyrightLine: copyrightLine?.trim() || "",
      isPublished: published,
      status: status || (published ? "published" : "draft"),
      isPremiumOnly: toBoolean(isPremiumOnly, false),
      isFeatured: toBoolean(isFeatured, false),
      isCoffeeSupportEnabled: toBoolean(isCoffeeSupportEnabled, true),
      isFanClubExclusive: toBoolean(isFanClubExclusive, false),
    });

    const populatedAlbum = await populateAlbum(Album.findById(album._id));

    res.status(201).json({
      success: true,
      message: "Album created successfully",
      album: populatedAlbum,
    });
  } catch (error) {
    console.error("Create admin album error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create album",
      error: error.message,
    });
  }
};

const updateAdminAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const fields = [
      "title",
      "description",
      "genre",
      "language",
      "releaseDate",
      "labelName",
      "copyrightLine",
      "status",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        album[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    });

    if (req.body.artistId) {
      const artist = await Artist.findById(req.body.artistId);

      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }

      album.artistId = req.body.artistId;
    }

    if (req.files?.coverImage?.[0]?.location) {
      album.coverImage = req.files.coverImage[0].location;
    }

    if (req.files?.bannerImage?.[0]?.location) {
      album.bannerImage = req.files.bannerImage[0].location;
    }

    if (req.body.isPublished !== undefined) {
      album.isPublished = toBoolean(req.body.isPublished, album.isPublished);
      album.status = album.isPublished ? "published" : "unpublished";
    }

    if (req.body.isPremiumOnly !== undefined) {
      album.isPremiumOnly = toBoolean(req.body.isPremiumOnly, false);
    }

    if (req.body.isFeatured !== undefined) {
      album.isFeatured = toBoolean(req.body.isFeatured, false);
    }

    if (req.body.isCoffeeSupportEnabled !== undefined) {
      album.isCoffeeSupportEnabled = toBoolean(
        req.body.isCoffeeSupportEnabled,
        true,
      );
    }

    if (req.body.isFanClubExclusive !== undefined) {
      album.isFanClubExclusive = toBoolean(req.body.isFanClubExclusive, false);
    }

    await album.save();

    const updatedAlbum = await populateAlbum(Album.findById(album._id));

    res.status(200).json({
      success: true,
      message: "Album updated successfully",
      album: updatedAlbum,
    });
  } catch (error) {
    console.error("Update admin album error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update album",
      error: error.message,
    });
  }
};

const deleteAdminAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    await Song.updateMany({ albumId: album._id }, { $set: { albumId: null } });

    await Album.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Album deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin album error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete album",
      error: error.message,
    });
  }
};

const publishAdminAlbum = async (req, res) => {
  try {
    const album = await Album.findByIdAndUpdate(
      req.params.id,
      {
        isPublished: true,
        status: "published",
      },
      { returnDocument: "after" },
    ).populate("artistId", "stageName artistName profileImage");

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Album published successfully",
      album,
    });
  } catch (error) {
    console.error("Publish admin album error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to publish album",
      error: error.message,
    });
  }
};

const unpublishAdminAlbum = async (req, res) => {
  try {
    const album = await Album.findByIdAndUpdate(
      req.params.id,
      {
        isPublished: false,
        status: "unpublished",
      },
      { returnDocument: "after" },
    ).populate("artistId", "stageName artistName profileImage");

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Album unpublished successfully",
      album,
    });
  } catch (error) {
    console.error("Unpublish admin album error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unpublish album",
      error: error.message,
    });
  }
};

const addSongToAlbum = async (req, res) => {
  try {
    const { songId } = req.body || {};

    if (!songId) {
      return res.status(400).json({
        success: false,
        message: "Song ID is required",
      });
    }

    const album = await Album.findById(req.params.id);
    const song = await Song.findById(songId);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    const songExists = album.songs.some((id) => id.toString() === songId);

    if (!songExists) {
      album.songs.push(songId);
    }

    song.albumId = album._id;

    await Promise.all([album.save(), song.save()]);

    const updatedAlbum = await populateAlbum(Album.findById(album._id));

    res.status(200).json({
      success: true,
      message: songExists
        ? "Song already exists in album"
        : "Song added to album successfully",
      album: updatedAlbum,
    });
  } catch (error) {
    console.error("Add song to album error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add song to album",
      error: error.message,
    });
  }
};

const removeSongFromAlbum = async (req, res) => {
  try {
    const { songId } = req.body || {};

    if (!songId) {
      return res.status(400).json({
        success: false,
        message: "Song ID is required",
      });
    }

    const album = await Album.findById(req.params.id);
    const song = await Song.findById(songId);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    album.songs = album.songs.filter((id) => id.toString() !== songId);

    if (song && song.albumId?.toString() === album._id.toString()) {
      song.albumId = null;
      await Promise.all([album.save(), song.save()]);
    } else {
      await album.save();
    }

    const updatedAlbum = await populateAlbum(Album.findById(album._id));

    res.status(200).json({
      success: true,
      message: "Song removed from album successfully",
      album: updatedAlbum,
    });
  } catch (error) {
    console.error("Remove song from album error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove song from album",
      error: error.message,
    });
  }
};

const getAlbumAnalytics = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).populate("songs");

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const songs = album.songs || [];

    const analytics = {
      totalSongs: songs.length,
      totalPlays: album.totalPlays || 0,
      likeCount: album.likeCount || 0,
      saveCount: album.saveCount || 0,
      revenue: album.revenue || 0,
      isPublished: album.isPublished,
      status: album.status,
    };

    res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Get album analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch album analytics",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminAlbums,
  getAdminAlbumById,
  createAdminAlbum,
  updateAdminAlbum,
  deleteAdminAlbum,

  publishAlbum: publishAdminAlbum,
  unpublishAlbum: unpublishAdminAlbum,

  addSongToAlbum,
  removeSongFromAlbum,
  getAlbumAnalytics,
};
