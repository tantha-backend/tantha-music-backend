const User = require("../models/User");
const Artist = require("../models/Artist");
const Song = require("../models/Song");
const CoffeeSupport = require("../models/CoffeeSupport");
const FanClubSubscription = require("../models/FanClubSubscription");

const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalArtists = await Artist.countDocuments();
    const totalSongs = await Song.countDocuments();

    const pendingSongs = await Song.countDocuments({
      isPublished: false,
      isRejected: { $ne: true },
    });

    const premiumUsers = await User.countDocuments({
      isPremium: true,
    });

    const streamData = await Song.aggregate([
      {
        $group: {
          _id: null,
          totalStreams: {
            $sum: "$playCount",
          },
        },
      },
    ]);

    const coffeeData = await CoffeeSupport.aggregate([
      {
        $group: {
          _id: null,
          totalCoffeeRevenue: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const fanClubData = await FanClubSubscription.aggregate([
      {
        $group: {
          _id: null,
          totalFanClubRevenue: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const recentSongs = await Song.find()
      .populate("artistId", "stageName profileImage")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        totalArtists,
        totalSongs,
        pendingSongs,
        premiumUsers,
        totalStreams: streamData[0]?.totalStreams || 0,
        coffeeRevenue: coffeeData[0]?.totalCoffeeRevenue || 0,
        fanClubRevenue: fanClubData[0]?.totalFanClubRevenue || 0,
      },
      recentSongs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
      error: error.message,
    });
  }
};

const getAllAdminSongs = async (req, res) => {
  try {
    const songs = await Song.find()
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
      message: "Failed to fetch admin songs",
      error: error.message,
    });
  }
};

const getPendingSongs = async (req, res) => {
  try {
    const songs = await Song.find({
      isPublished: false,
      isRejected: { $ne: true },
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
      message: "Failed to fetch pending songs",
      error: error.message,
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

    song.isPublished = true;
    song.isRejected = false;
    song.rejectionReason = "";
    song.approvedAt = new Date();
    song.approvedBy = req.user.id;

    await song.save();

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

const rejectSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    song.isPublished = false;
    song.isRejected = true;
    song.rejectionReason = req.body.reason || "Rejected by admin";
    song.approvedAt = null;
    song.approvedBy = null;

    await song.save();

    res.status(200).json({
      success: true,
      message: "Song rejected successfully",
      song,
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
  getAdminDashboard,
  getAllAdminSongs,
  getPendingSongs,
  approveSong,
  rejectSong,
};