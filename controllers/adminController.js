const Song = require("../models/Song");
const Artist = require("../models/Artist");
const Notification = require("../models/Notification");

// GET pending songs
const getPendingSongs = async (req, res) => {
  try {
    const songs = await Song.find({ isPublished: false })
      .populate("artistId", "stageName profileImage isVerified")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending songs",
      error: error.message,
    });
  }
};

// APPROVE song
const approveSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    song.isPublished = true;
await song.save();

const artist = await Artist.findById(song.artistId);

if (artist && artist.followers.length > 0) {
  const notifications = artist.followers.map((userId) => ({
    userId,
    title: "New Song Released",
    message: `${artist.stageName} released "${song.title}"`,
    type: "song",
  }));

  await Notification.insertMany(notifications);
}

    res.status(200).json({
      success: true,
      message: "Song approved and published successfully",
      song,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve song",
      error: error.message,
    });
  }
};

// REJECT song
const rejectSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    await song.deleteOne();

    res.status(200).json({
      success: true,
      message: "Song rejected and removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject song",
      error: error.message,
    });
  }
};

module.exports = {
  getPendingSongs,
  approveSong,
  rejectSong,
};