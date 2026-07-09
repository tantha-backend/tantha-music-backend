const Song = require("../../models/Song");
const Artist = require("../../models/Artist");

const notificationController = require("../notificationController");

const createNotification =
  notificationController.createNotification || (async () => null);

const getArtistDisplayName = (artist) => {
  return (
    artist?.stageName ||
    artist?.artistName ||
    artist?.name ||
    artist?.email ||
    "Unknown Artist"
  );
};

const getAdminSongs = async (req, res) => {
  try {
    const songs = await Song.find({
      status: "published",
      isPublished: true,
    })
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
    console.error("Get admin song error:", error);

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
        message: "Title, duration, genre, language and artist are required.",
      });
    }

    if (!req.files?.audio128?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Audio128 file is required.",
      });
    }

    const artist = await Artist.findById(artistId);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found.",
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

    console.log("========== SONG UPLOAD ==========");
    console.log("Audio128 :", audio128);
    console.log("Audio320 :", audio320);
    console.log("Cover    :", coverImage);
    console.log("=================================");

    const song = await Song.create({
      title,
      duration: Number(duration),
      genre,
      language,
      lyrics: lyrics || "",
      artistId,
      audio128,
      audio320,
      coverImage,
      isPremiumOnly: isPremiumOnly === true || isPremiumOnly === "true",
      status: "pending",
      isPublished: false,
    });

    const populatedSong = await Song.findById(song._id).populate(
      "artistId",
      "stageName artistName name email",
    );

    await createNotification({
      userId: null,
      title: "New song uploaded",
      message: `${title} by ${getArtistDisplayName(
        populatedSong?.artistId || artist,
      )} is waiting for approval.`,
      type: "song",
      targetType: "song",
      targetId: song._id,
      link: "/approvals",
    });

    res.status(201).json({
      success: true,
      message: "Song uploaded successfully.",
      song: populatedSong,
    });
  } catch (error) {
    console.error("Create admin song error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const approveSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      });
    }

    song.status = "published";
    song.isPublished = true;

    await song.save();

    const populatedSong = await Song.findById(song._id).populate(
      "artistId",
      "stageName artistName name email",
    );

    await createNotification({
      userId: null,
      title: "Song approved",
      message: `${populatedSong.title} by ${getArtistDisplayName(
        populatedSong.artistId,
      )} has been approved and published.`,
      type: "song",
      targetType: "song",
      targetId: populatedSong._id,
      link: "/songs",
    });

    res.status(200).json({
      success: true,
      message: "Song approved successfully.",
      song: populatedSong,
    });
  } catch (error) {
    console.error("Approve song error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to approve song.",
    });
  }
};

const rejectSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).populate(
      "artistId",
      "stageName artistName name email",
    );

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      });
    }

    song.status = "rejected";
    song.isPublished = false;
    song.rejectionReason = req.body.reason || "Rejected by administrator.";

    await song.save();

    await createNotification({
      userId: null,
      title: "Song rejected",
      message: `${song.title} by ${getArtistDisplayName(
        song.artistId,
      )} was rejected.`,
      type: "song",
      targetType: "song",
      targetId: song._id,
      link: "/approvals",
    });

    res.status(200).json({
      success: true,
      message: "Song rejected successfully.",
      song,
    });
  } catch (error) {
    console.error("Reject song error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reject song.",
    });
  }
};

const deleteSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      });
    }

    await Song.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Song deleted successfully.",
    });
  } catch (error) {
    console.error("Delete song error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete song.",
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