const Artist = require("../models/Artist");
const Song = require("../models/Song");
const ListeningHistory = require("../models/ListeningHistory");

const getMyArtistDashboard = async (req, res) => {
  try {
    const artist = await Artist.findOne({ userId: req.user.id });

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist profile not found",
      });
    }

    const songs = await Song.find({ artistId: artist._id });

    const totalSongs = songs.length;

    const totalStreams = songs.reduce((sum, song) => {
      return sum + song.playCount;
    }, 0);

    const totalLikes = songs.reduce((sum, song) => {
      return sum + song.likeCount;
    }, 0);

    const songIds = songs.map((song) => song._id);

    const monthlyListeners = await ListeningHistory.distinct("userId", {
      songId: { $in: songIds },
      playedAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    });

    const topSongs = songs
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5)
      .map((song) => ({
        _id: song._id,
        title: song.title,
        coverImage: song.coverImage,
        playCount: song.playCount,
        likeCount: song.likeCount,
        isPublished: song.isPublished,
      }));

    res.status(200).json({
      success: true,
      dashboard: {
        artist: {
          _id: artist._id,
          stageName: artist.stageName,
          profileImage: artist.profileImage,
          isVerified: artist.isVerified,
        },

        stats: {
          totalSongs,
          publishedSongs: songs.filter((song) => song.isPublished).length,
          pendingSongs: songs.filter((song) => !song.isPublished).length,
          totalStreams,
          totalLikes,
          followersCount: artist.followersCount,
          monthlyListeners: monthlyListeners.length,
        },

        topSongs,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch artist dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getMyArtistDashboard,
};