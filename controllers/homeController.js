const Song = require("../models/Song");
const Artist = require("../models/Artist");

const getHomeFeed = async (req, res) => {
  try {
    const trendingSongs = await Song.find({ isPublished: true })
      .sort({ playCount: -1, likeCount: -1, commentCount: -1 })
      .limit(10)
      .populate("artistId", "stageName profileImage isVerified");

    const newReleases = await Song.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("artistId", "stageName profileImage isVerified");

    const trendingArtists = await Artist.find({})
      .sort({
        followersCount: -1,
        totalStreams: -1,
        monthlyListeners: -1,
      })
      .select(
        "stageName profileImage followersCount isVerified totalStreams monthlyListeners"
      )
      .limit(10);

    res.status(200).json({
      success: true,
      home: {
        trendingSongs,
        newReleases,
        trendingArtists,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch home feed",
      error: error.message,
    });
  }
};

module.exports = {
  getHomeFeed,
};