const Artist = require("../models/Artist");

const searchArtists = async (req, res) => {
  try {
    const { q } = req.query;

    const artists = await Artist.find({
      stageName: {
        $regex: q || "",
        $options: "i",
      },
    })
      .select(
        "stageName profileImage followersCount isVerified totalStreams monthlyListeners"
      )
      .limit(20);

    res.status(200).json({
      success: true,
      count: artists.length,
      artists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search artists",
      error: error.message,
    });
  }
};

const getTrendingArtists = async (req, res) => {
  try {
    const artists = await Artist.find({})
      .sort({
        followersCount: -1,
        totalStreams: -1,
        monthlyListeners: -1,
      })
      .select(
        "stageName profileImage followersCount isVerified totalStreams monthlyListeners"
      )
      .limit(20);

    res.status(200).json({
      success: true,
      count: artists.length,
      artists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending artists",
      error: error.message,
    });
  }
};

module.exports = {
  searchArtists,
  getTrendingArtists,
};