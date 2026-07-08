const Song = require("../../models/Song");
const Artist = require("../../models/Artist");
const Album = require("../../models/Album");

const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalSongs,
      pendingSongs,
      publishedSongs,
      totalArtists,
      totalAlbums,
    ] = await Promise.all([
      Song.countDocuments(),
      Song.countDocuments({ isPublished: false }),
      Song.countDocuments({ isPublished: true }),
      Artist.countDocuments(),
      Album.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalSongs,
        pendingSongs,
        publishedSongs,
        totalArtists,
        totalAlbums,
      },
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminDashboard,
};
