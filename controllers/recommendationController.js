const Song = require("../models/Song");

const getRecommendedSongs = async (req, res) => {
  try {
    const likedSongs = await Song.find({
      likes: req.user.id,
    });

    if (!likedSongs.length) {
      const trendingSongs = await Song.find({
        isPublished: true,
      })
        .sort({
          playCount: -1,
          likeCount: -1,
        })
        .limit(10)
        .populate(
          "artistId",
          "stageName profileImage isVerified"
        );

      return res.status(200).json({
        success: true,
        source: "trending",
        songs: trendingSongs,
      });
    }

    const genres = [
      ...new Set(
        likedSongs.map((song) => song.genre)
      ),
    ];

    const likedSongIds = likedSongs.map((song) => song._id);

const recommendations = await Song.find({
  _id: { $nin: likedSongIds },
  genre: { $in: genres },
  isPublished: true,
})
      .limit(20)
      .populate(
        "artistId",
        "stageName profileImage isVerified"
      );

    res.status(200).json({
      success: true,
      source: "personalized",
      genres,
      songs: recommendations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
      error: error.message,
    });
  }
};

module.exports = {
  getRecommendedSongs,
};