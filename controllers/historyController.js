const ListeningHistory = require("../models/ListeningHistory");

const getRecentHistory = async (req, res) => {
  try {
    const history = await ListeningHistory.find({
      userId: req.user.id,
    })
      .populate({
        path: "songId",
        match: { isPublished: true },
        select:
          "title artistId coverImage audio64 audio128 audio320 duration genre language playCount likeCount isPremiumOnly isPublished",
        populate: {
          path: "artistId",
          select: "stageName profileImage isVerified",
        },
      })
      .sort({ playedAt: -1 })
      .limit(20);

    const filteredHistory = history.filter((item) => item.songId !== null);

    res.status(200).json({
      success: true,
      count: filteredHistory.length,
      recent: filteredHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent history",
      error: error.message,
    });
  }
};

const getAllHistory = async (req, res) => {
  try {
    const history = await ListeningHistory.find({
      userId: req.user.id,
    })
      .populate({
        path: "songId",
        match: { isPublished: true },
        select:
          "title artistId coverImage audio64 audio128 audio320 duration genre language playCount likeCount isPremiumOnly isPublished",
        populate: {
          path: "artistId",
          select: "stageName profileImage isVerified",
        },
      })
      .sort({ playedAt: -1 });

    const filteredHistory = history.filter((item) => item.songId !== null);

    res.status(200).json({
      success: true,
      count: filteredHistory.length,
      history: filteredHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch listening history",
      error: error.message,
    });
  }
};

const clearHistory = async (req, res) => {
  try {
    await ListeningHistory.deleteMany({
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Listening history cleared successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to clear listening history",
      error: error.message,
    });
  }
};

module.exports = {
  getRecentHistory,
  getAllHistory,
  clearHistory,
};