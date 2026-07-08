const Song = require("../../models/Song");
const Artist = require("../../models/Artist");

const getAdminSongs = async (req, res) => {
  try {
    const songs = await Song.find()
      .populate("artistId", "stageName artistName name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("Get admin songs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch songs",
    });
  }
};

const getPendingSongs = async (req, res) => {
  try {
    const songs = await Song.find({ status: "pending" })
      .populate("artistId", "stageName artistName name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("Get pending songs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending songs",
    });
  }
};

const getAdminSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).populate(
      "artistId",
      "stageName artistName name email",
    );

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
    console.error("Get admin song by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch song",
    });
  }
};

const createAdminSong = async (req, res) => {
  try {
    const {
      title,
      duration,
      genre,
      language,
      lyrics,
      isPremiumOnly,
      artistId,
    } = req.body;

    if (!title || !duration || !genre || !language || !artistId) {
      return res.status(400).json({
        success: false,
        message: "Title, duration, genre, language and artist are required",
      });
    }

    if (!req.files || !req.files.audio128 || !req.files.audio128[0]) {
      return res.status(400).json({
        success: false,
        message: "audio128 file is required",
      });
    }

    const artist = await Artist.findById(artistId);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const audio128 =
      req.files.audio128[0].location || req.files.audio128[0].path;

    const audio320 = req.files.audio320?.[0]
      ? req.files.audio320[0].location || req.files.audio320[0].path
      : "";

    const coverImage = req.files.cover?.[0]
      ? req.files.cover[0].location || req.files.cover[0].path
      : "";

    const song = await Song.create({
      title,
      duration,
      genre,
      language,
      lyrics: lyrics || "",
      isPremiumOnly: isPremiumOnly === "true" || isPremiumOnly === true,
      artistId,
      audio128,
      audio320,
      coverImage,
      status: "published",
      isPublished: true,
    });

    const populatedSong = await Song.findById(song._id).populate(
      "artistId",
      "stageName artistName name email",
    );

    res.status(201).json({
      success: true,
      message: "Song created successfully",
      song: populatedSong,
    });
  } catch (error) {
    console.error("Create admin song error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create song",
    });
  }
};

const approveSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    song.status = "published";
    song.isPublished = true;
    await song.save();

    res.status(200).json({
      success: true,
      message: "Song approved successfully",
      song,
    });
  } catch (error) {
    console.error("Approve song error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve song",
    });
  }
};

const rejectSong = async (req, res) => {
  try {
    const { reason } = req.body;

    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    song.status = "rejected";
    song.isPublished = false;
    song.rejectionReason = reason || "No reason provided";
    await song.save();

    res.status(200).json({
      success: true,
      message: "Song rejected successfully",
      song,
    });
  } catch (error) {
    console.error("Reject song error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject song",
    });
  }
};

const deleteSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    await Song.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Song deleted successfully",
    });
  } catch (error) {
    console.error("Delete song error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete song",
    });
  }
};

module.exports = {
  getAdminSongs,
  getPendingSongs,
  getAdminSongById,
  createAdminSong,
  approveSong,
  rejectSong,
  deleteSong,
};
