const Album = require("../models/Album");
const Artist = require("../models/Artist");
const Song = require("../models/Song");

const createAlbum = async (req, res) => {
  try {
    const artist = await Artist.findOne({
      userId: req.user.id,
    });

    if (!artist) {
      return res.status(403).json({
        success: false,
        message: "Only artists can create albums",
      });
    }

    const { title, description, releaseDate } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Album title is required",
      });
    }

    const album = await Album.create({
      title,
      artistId: artist._id,
      coverImage: req.files?.coverImage?.[0]?.location || "",
      description: description || "",
      releaseDate,
      isPublished: true,
    });

    res.status(201).json({
      success: true,
      message: "Album created successfully",
      album,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create album",
      error: error.message,
    });
  }
};
const getAlbums = async (req, res) => {
  try {
    const albums = await Album.find({ isPublished: true })
      .populate("artistId", "stageName bio profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: albums.length,
      albums,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch albums",
      error: error.message,
    });
  }
};

const getAlbumById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
  .populate("artistId", "stageName bio profileImage")
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch album",
      error: error.message,
    });
  }
};

const getAlbumSongs = async (req, res) => {
  try {
    const songs = await Song.find({
      albumId: req.params.id,
      isPublished: true,
    })
      .populate("artistId", "stageName bio profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch album songs",
      error: error.message,
    });
  }
};

module.exports = {
  createAlbum,
  getAlbums,
  getAlbumById,
  getAlbumSongs,
};