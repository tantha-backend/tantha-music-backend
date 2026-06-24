const Song = require("../models/Song");
const Artist = require("../models/Artist");
const User = require("../models/User");
const ListeningHistory = require("../models/ListeningHistory");

const createSong = async (req, res) => {
  try {
    console.log("UPLOAD BODY:", req.body);
    console.log("UPLOAD FILES:", req.files);
    console.log("UPLOAD USER:", req.user);

    const artist = await Artist.findOne({ userId: req.user.id });

    if (!artist) {
      return res.status(403).json({
        success: false,
        message: "Only artists can upload songs",
      });
    }

    const { title, duration, genre, language, lyrics, isPremiumOnly } = req.body;

    if (!title || !duration || !genre || !language) {
      return res.status(400).json({
        success: false,
        message: "Title, duration, genre and language are required",
        receivedBody: req.body,
      });
    }

    if (!req.files || !req.files.audio128) {
      return res.status(400).json({
        success: false,
        message: "audio128 file is required",
        receivedFiles: req.files,
      });
    }

    const song = await Song.create({
      title,
      artistId: artist._id,
      audio128: req.files.audio128[0].location,
      audio64: "",
      audio320: req.files.audio320?.[0]?.location || "",
      coverImage: req.files.coverImage?.[0]?.location || "",
      duration,
      genre,
      language,
      lyrics: lyrics || "",
      isPremiumOnly: isPremiumOnly === "true" || isPremiumOnly === true,
      isPublished: false,
    });

    res.status(201).json({
      success: true,
      message: "Song submitted for admin approval",
      song,
    });
  } catch (error) {
    console.log("SONG UPLOAD ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Song upload failed",
      error: error.message,
    });
  }
};

const getPublishedSongs = async (req, res) => {
  try {
    const songs = await Song.find({ isPublished: true })
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
      message: "Failed to fetch songs",
      error: error.message,
    });
  }
};

const getTrendingSongs = async (req, res) => {
  try {
    const songs = await Song.find({ isPublished: true })
      .populate("artistId", "stageName bio profileImage")
      .sort({
        playCount: -1,
        likeCount: -1,
      })
      .limit(20);

    res.status(200).json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending songs",
      error: error.message,
    });
  }
};

const getSongById = async (req, res) => {
  try {
    const song = await Song.findOne({
      _id: req.params.id,
      isPublished: true,
    }).populate("artistId", "stageName bio profileImage");

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    res.status(200).json({
      success: true,
      song,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch song",
      error: error.message,
    });
  }
};

const getSongsByArtist = async (req, res) => {
  try {
    const songs = await Song.find({
      artistId: req.params.artistId,
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
      message: "Failed to fetch artist songs",
      error: error.message,
    });
  }
};

const playSong = async (req, res) => {
  try {
    const song = await Song.findOne({
      _id: req.params.id,
      isPublished: true,
    }).populate("artistId", "stageName bio profileImage");

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found or not published",
      });
    }

    if (song.isPremiumOnly) {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Login required to play premium songs",
        });
      }

      const user = await User.findById(req.user.id).select(
        "isPremium premiumExpiresAt"
      );

      const premiumExpired =
        user.premiumExpiresAt &&
        new Date(user.premiumExpiresAt) < new Date();

      if (!user.isPremium || premiumExpired) {
        return res.status(403).json({
          success: false,
          message: "Premium membership required to play this song",
        });
      }
    }

    song.playCount += 1;
    await song.save();

    if (req.user && req.user.id) {
      await ListeningHistory.create({
        userId: req.user.id,
        songId: song._id,
        playedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: "Song play recorded",
      song,
      streamUrl: song.audio128,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to play song",
      error: error.message,
    });
  }
};

const likeSong = async (req, res) => {
  try {
    const songId = req.params.id;
    const userId = req.user.id;

    const song = await Song.findOne({
      _id: songId,
      isPublished: true,
    });

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found or not published",
      });
    }

    const user = await User.findById(userId);

    const alreadyLiked = user.likedSongs.some(
      (id) => id.toString() === songId
    );

    if (alreadyLiked) {
      user.likedSongs.pull(songId);
      song.likes.pull(userId);
      song.likeCount = Math.max(0, song.likeCount - 1);

      await user.save();
      await song.save();

      return res.status(200).json({
        success: true,
        message: "Song unliked",
        liked: false,
        likeCount: song.likeCount,
      });
    }

    user.likedSongs.push(songId);
    song.likes.push(userId);
    song.likeCount += 1;

    await user.save();
    await song.save();

    res.status(200).json({
      success: true,
      message: "Song liked",
      liked: true,
      likeCount: song.likeCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to like song",
      error: error.message,
    });
  }
};

const getLikedSongs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "likedSongs",
      match: { isPublished: true },
      populate: {
        path: "artistId",
        select: "stageName bio profileImage",
      },
    });

    res.status(200).json({
      success: true,
      count: user.likedSongs.length,
      likedSongs: user.likedSongs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch liked songs",
      error: error.message,
    });
  }
};

const searchSongs = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const songs = await Song.find({
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { genre: { $regex: query, $options: "i" } },
        { language: { $regex: query, $options: "i" } },
        { lyrics: { $regex: query, $options: "i" } },
      ],
    })
      .populate("artistId", "stageName bio profileImage")
      .sort({ playCount: -1 });

    res.status(200).json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message,
    });
  }
};

const addSongToAlbum = async (req, res) => {
  try {
    const { songId, albumId } = req.params;

    const song = await Song.findById(songId);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    song.albumId = albumId;
    await song.save();

    res.status(200).json({
      success: true,
      message: "Song added to album successfully",
      song,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add song to album",
      error: error.message,
    });
  }
};

module.exports = {
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
};