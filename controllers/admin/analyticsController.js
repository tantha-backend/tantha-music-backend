const User = require("../../models/User");
const Artist = require("../../models/Artist");
const Song = require("../../models/Song");
const Album = require("../../models/Album");
const Playlist = require("../../models/Playlist");

const getDateRange = (range = "30d") => {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case "7d":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "90d":
      startDate.setDate(endDate.getDate() - 90);
      break;
    case "1y":
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case "all":
      return {};
    case "30d":
    default:
      startDate.setDate(endDate.getDate() - 30);
      break;
  }

  return {
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  };
};

const getGrowthPercentage = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(2));
};

const getPreviousRange = (range = "30d") => {
  const now = new Date();
  const currentStart = new Date();

  switch (range) {
    case "7d":
      currentStart.setDate(now.getDate() - 7);
      break;
    case "90d":
      currentStart.setDate(now.getDate() - 90);
      break;
    case "1y":
      currentStart.setFullYear(now.getFullYear() - 1);
      break;
    case "30d":
    default:
      currentStart.setDate(now.getDate() - 30);
      break;
  }

  const previousEnd = new Date(currentStart);
  const previousStart = new Date(currentStart);

  switch (range) {
    case "7d":
      previousStart.setDate(previousStart.getDate() - 7);
      break;
    case "90d":
      previousStart.setDate(previousStart.getDate() - 90);
      break;
    case "1y":
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      break;
    case "30d":
    default:
      previousStart.setDate(previousStart.getDate() - 30);
      break;
  }

  return {
    createdAt: {
      $gte: previousStart,
      $lt: previousEnd,
    },
  };
};

const getStartDateForChart = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildDailyChart = async (Model, days = 30, extraMatch = {}) => {
  const startDate = getStartDateForChart(days);

  const data = await Model.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        ...extraMatch,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
      },
    },
  ]);

  return data.map((item) => ({
    date: `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(
      item._id.day,
    ).padStart(2, "0")}`,
    count: item.count,
  }));
};
const getDashboardOverview = async (req, res) => {
  try {
    const range = req.query.range || "30d";

    const currentFilter = getDateRange(range);
    const previousFilter = getPreviousRange(range);

    const [
      totalUsers,
      totalArtists,
      totalSongs,
      totalAlbums,
      totalPlaylists,

      premiumUsers,
      publishedSongs,
      pendingSongs,

      featuredArtists,
      featuredPlaylists,

      currentUsers,
      previousUsers,

      currentArtists,
      previousArtists,

      currentSongs,
      previousSongs,

      currentAlbums,
      previousAlbums,

      currentPlaylists,
      previousPlaylists,
    ] = await Promise.all([
      User.countDocuments(),

      Artist.countDocuments(),

      Song.countDocuments(),

      Album.countDocuments(),

      Playlist.countDocuments(),

      User.countDocuments({
        isPremium: true,
      }),

      Song.countDocuments({
        isPublished: true,
      }),

      Song.countDocuments({
        isPublished: false,
      }),

      Artist.countDocuments({
        isFeatured: true,
      }),

      Playlist.countDocuments({
        isFeatured: true,
      }),

      User.countDocuments(currentFilter),

      User.countDocuments(previousFilter),

      Artist.countDocuments(currentFilter),

      Artist.countDocuments(previousFilter),

      Song.countDocuments(currentFilter),

      Song.countDocuments(previousFilter),

      Album.countDocuments(currentFilter),

      Album.countDocuments(previousFilter),

      Playlist.countDocuments(currentFilter),

      Playlist.countDocuments(previousFilter),
    ]);

    const overview = {
      totals: {
        users: totalUsers,
        artists: totalArtists,
        songs: totalSongs,
        albums: totalAlbums,
        playlists: totalPlaylists,
      },

      content: {
        publishedSongs,
        pendingSongs,
        featuredArtists,
        featuredPlaylists,
      },

      premium: {
        premiumUsers,
        premiumPercentage:
          totalUsers === 0
            ? 0
            : Number(((premiumUsers / totalUsers) * 100).toFixed(2)),
      },

      growth: {
        users: {
          current: currentUsers,
          previous: previousUsers,
          percentage: getGrowthPercentage(currentUsers, previousUsers),
        },

        artists: {
          current: currentArtists,
          previous: previousArtists,
          percentage: getGrowthPercentage(currentArtists, previousArtists),
        },

        songs: {
          current: currentSongs,
          previous: previousSongs,
          percentage: getGrowthPercentage(currentSongs, previousSongs),
        },

        albums: {
          current: currentAlbums,
          previous: previousAlbums,
          percentage: getGrowthPercentage(currentAlbums, previousAlbums),
        },

        playlists: {
          current: currentPlaylists,
          previous: previousPlaylists,
          percentage: getGrowthPercentage(currentPlaylists, previousPlaylists),
        },
      },
    };

    res.status(200).json({
      success: true,
      overview,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard overview",
      error: error.message,
    });
  }
};

const getDashboardCharts = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;

    const [userChart, artistChart, songChart, albumChart, playlistChart] =
      await Promise.all([
        buildDailyChart(User, days),
        buildDailyChart(Artist, days),
        buildDailyChart(Song, days),
        buildDailyChart(Album, days),
        buildDailyChart(Playlist, days),
      ]);

    res.status(200).json({
      success: true,
      charts: {
        users: userChart,
        artists: artistChart,
        songs: songChart,
        albums: albumChart,
        playlists: playlistChart,
      },
    });
  } catch (error) {
    console.error("Dashboard charts error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard charts",
      error: error.message,
    });
  }
};

const getPlatformStatistics = async (req, res) => {
  try {
    const [
      totalSongPlays,
      totalPlaylistFollowers,
      totalPlaylistPlays,
      totalAlbumPlays,
      totalSongLikes,
      totalAlbumLikes,
    ] = await Promise.all([
      Song.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$playCount",
            },
          },
        },
      ]),

      Playlist.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$followerCount",
            },
          },
        },
      ]),

      Playlist.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$playCount",
            },
          },
        },
      ]),

      Album.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalPlays",
            },
          },
        },
      ]),

      Song.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$likeCount",
            },
          },
        },
      ]),

      Album.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$likeCount",
            },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalSongPlays: totalSongPlays[0]?.total || 0,

        totalAlbumPlays: totalAlbumPlays[0]?.total || 0,

        totalPlaylistPlays: totalPlaylistPlays[0]?.total || 0,

        totalSongLikes: totalSongLikes[0]?.total || 0,

        totalAlbumLikes: totalAlbumLikes[0]?.total || 0,

        totalPlaylistFollowers: totalPlaylistFollowers[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Platform statistics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch platform statistics",
      error: error.message,
    });
  }
};
const getTopContentAnalytics = async (req, res) => {
  try {
    const limit = Math.max(Number(req.query.limit) || 10, 1);

    const [topSongs, topArtists, topAlbums, topPlaylists] = await Promise.all([
      Song.find()
        .populate("artistId", "stageName artistName profileImage")
        .sort({ playCount: -1, likeCount: -1, createdAt: -1 })
        .limit(limit),

      Artist.find()
        .sort({ followersCount: -1, monthlyListeners: -1, createdAt: -1 })
        .limit(limit),

      Album.find()
        .populate("artistId", "stageName artistName profileImage")
        .sort({ totalPlays: -1, likeCount: -1, createdAt: -1 })
        .limit(limit),

      Playlist.find()
        .populate("userId", "name email role profileImage")
        .sort({ playCount: -1, followerCount: -1, createdAt: -1 })
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      topContent: {
        songs: topSongs,
        artists: topArtists,
        albums: topAlbums,
        playlists: topPlaylists,
      },
    });
  } catch (error) {
    console.error("Top content analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch top content analytics",
      error: error.message,
    });
  }
};

const getGenreAnalytics = async (req, res) => {
  try {
    const [songGenres, albumGenres] = await Promise.all([
      Song.aggregate([
        {
          $match: {
            genre: {
              $exists: true,
              $ne: "",
            },
          },
        },
        {
          $group: {
            _id: "$genre",
            count: {
              $sum: 1,
            },
            totalPlays: {
              $sum: "$playCount",
            },
            totalLikes: {
              $sum: "$likeCount",
            },
          },
        },
        {
          $sort: {
            count: -1,
            totalPlays: -1,
          },
        },
      ]),

      Album.aggregate([
        {
          $match: {
            genre: {
              $exists: true,
              $ne: "",
            },
          },
        },
        {
          $group: {
            _id: "$genre",
            count: {
              $sum: 1,
            },
            totalPlays: {
              $sum: "$totalPlays",
            },
            totalLikes: {
              $sum: "$likeCount",
            },
          },
        },
        {
          $sort: {
            count: -1,
            totalPlays: -1,
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      genres: {
        songs: songGenres.map((genre) => ({
          genre: genre._id,
          count: genre.count,
          totalPlays: genre.totalPlays || 0,
          totalLikes: genre.totalLikes || 0,
        })),
        albums: albumGenres.map((genre) => ({
          genre: genre._id,
          count: genre.count,
          totalPlays: genre.totalPlays || 0,
          totalLikes: genre.totalLikes || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Genre analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch genre analytics",
      error: error.message,
    });
  }
};

const getLanguageAnalytics = async (req, res) => {
  try {
    const [songLanguages, albumLanguages] = await Promise.all([
      Song.aggregate([
        {
          $match: {
            language: {
              $exists: true,
              $ne: "",
            },
          },
        },
        {
          $group: {
            _id: "$language",
            count: {
              $sum: 1,
            },
            totalPlays: {
              $sum: "$playCount",
            },
            totalLikes: {
              $sum: "$likeCount",
            },
          },
        },
        {
          $sort: {
            count: -1,
            totalPlays: -1,
          },
        },
      ]),

      Album.aggregate([
        {
          $match: {
            language: {
              $exists: true,
              $ne: "",
            },
          },
        },
        {
          $group: {
            _id: "$language",
            count: {
              $sum: 1,
            },
            totalPlays: {
              $sum: "$totalPlays",
            },
            totalLikes: {
              $sum: "$likeCount",
            },
          },
        },
        {
          $sort: {
            count: -1,
            totalPlays: -1,
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      languages: {
        songs: songLanguages.map((language) => ({
          language: language._id,
          count: language.count,
          totalPlays: language.totalPlays || 0,
          totalLikes: language.totalLikes || 0,
        })),
        albums: albumLanguages.map((language) => ({
          language: language._id,
          count: language.count,
          totalPlays: language.totalPlays || 0,
          totalLikes: language.totalLikes || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Language analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch language analytics",
      error: error.message,
    });
  }
};
const getGrowthAnalytics = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;

    const [users, artists, songs, albums, playlists] = await Promise.all([
      buildDailyChart(User, days),
      buildDailyChart(Artist, days),
      buildDailyChart(Song, days),
      buildDailyChart(Album, days),
      buildDailyChart(Playlist, days),
    ]);

    res.status(200).json({
      success: true,
      growth: {
        users,
        artists,
        songs,
        albums,
        playlists,
      },
    });
  } catch (error) {
    console.error("Growth analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch growth analytics",
      error: error.message,
    });
  }
};

const getContentStatusAnalytics = async (req, res) => {
  try {
    const [songStatus, albumStatus, playlistVisibility, userRoles] =
      await Promise.all([
        Song.aggregate([
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
        ]),

        Album.aggregate([
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
        ]),

        Playlist.aggregate([
          {
            $group: {
              _id: "$isPublic",
              count: {
                $sum: 1,
              },
            },
          },
        ]),

        User.aggregate([
          {
            $group: {
              _id: "$role",
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
        ]),
      ]);

    res.status(200).json({
      success: true,
      statusAnalytics: {
        songs: songStatus.map((item) => ({
          status: item._id || "unknown",
          count: item.count,
        })),

        albums: albumStatus.map((item) => ({
          status: item._id || "unknown",
          count: item.count,
        })),

        playlists: playlistVisibility.map((item) => ({
          visibility: item._id ? "public" : "private",
          count: item.count,
        })),

        users: userRoles.map((item) => ({
          role: item._id || "unknown",
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error("Content status analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch content status analytics",
      error: error.message,
    });
  }
};

const getRevenueAnalytics = async (req, res) => {
  try {
    const [albumRevenue] = await Promise.all([
      Album.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: "$revenue",
            },
            averageRevenue: {
              $avg: "$revenue",
            },
          },
        },
      ]),
    ]);

    const totalAlbumRevenue = albumRevenue[0]?.totalRevenue || 0;
    const averageAlbumRevenue = albumRevenue[0]?.averageRevenue || 0;

    res.status(200).json({
      success: true,
      revenue: {
        totalRevenue: totalAlbumRevenue,
        averageAlbumRevenue: Number(averageAlbumRevenue.toFixed(2)),
        premiumRevenue: 0,
        coffeeRevenue: 0,
        fanClubRevenue: 0,
        platformRevenue: totalAlbumRevenue,
      },
    });
  } catch (error) {
    console.error("Revenue analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
      error: error.message,
    });
  }
};

const getRecentActivityAnalytics = async (req, res) => {
  try {
    const limit = Math.max(Number(req.query.limit) || 10, 1);

    const [
      recentUsers,
      recentArtists,
      recentSongs,
      recentAlbums,
      recentPlaylists,
    ] = await Promise.all([
      User.find()
        .select("name email role isPremium createdAt")
        .sort({ createdAt: -1 })
        .limit(limit),

      Artist.find()
        .select("stageName artistName profileImage createdAt")
        .sort({ createdAt: -1 })
        .limit(limit),

      Song.find()
        .populate("artistId", "stageName artistName profileImage")
        .sort({ createdAt: -1 })
        .limit(limit),

      Album.find()
        .populate("artistId", "stageName artistName profileImage")
        .sort({ createdAt: -1 })
        .limit(limit),

      Playlist.find()
        .populate("userId", "name email role profileImage")
        .sort({ createdAt: -1 })
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      recent: {
        users: recentUsers,
        artists: recentArtists,
        songs: recentSongs,
        albums: recentAlbums,
        playlists: recentPlaylists,
      },
    });
  } catch (error) {
    console.error("Recent activity analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activity analytics",
      error: error.message,
    });
  }
};
const getFullAnalyticsDashboard = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const range = req.query.range || "30d";

    const currentFilter = getDateRange(range);
    const previousFilter = getPreviousRange(range);

    const [
      totalUsers,
      totalArtists,
      totalSongs,
      totalAlbums,
      totalPlaylists,
      premiumUsers,
      publishedSongs,
      pendingSongs,
      featuredPlaylists,
      currentUsers,
      previousUsers,
      currentSongs,
      previousSongs,
      userGrowthChart,
      songGrowthChart,
      albumGrowthChart,
      playlistGrowthChart,
      topSongs,
      topArtists,
      topAlbums,
      topPlaylists,
    ] = await Promise.all([
      User.countDocuments(),
      Artist.countDocuments(),
      Song.countDocuments(),
      Album.countDocuments(),
      Playlist.countDocuments(),

      User.countDocuments({ isPremium: true }),
      Song.countDocuments({ isPublished: true }),
      Song.countDocuments({ isPublished: false }),
      Playlist.countDocuments({ isFeatured: true }),

      User.countDocuments(currentFilter),
      User.countDocuments(previousFilter),
      Song.countDocuments(currentFilter),
      Song.countDocuments(previousFilter),

      buildDailyChart(User, days),
      buildDailyChart(Song, days),
      buildDailyChart(Album, days),
      buildDailyChart(Playlist, days),

      Song.find()
        .populate("artistId", "stageName artistName profileImage")
        .sort({ playCount: -1, likeCount: -1, createdAt: -1 })
        .limit(5),

      Artist.find()
        .sort({ followersCount: -1, monthlyListeners: -1, createdAt: -1 })
        .limit(5),

      Album.find()
        .populate("artistId", "stageName artistName profileImage")
        .sort({ totalPlays: -1, likeCount: -1, createdAt: -1 })
        .limit(5),

      Playlist.find()
        .populate("userId", "name email role profileImage")
        .sort({ playCount: -1, followerCount: -1, createdAt: -1 })
        .limit(5),
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        overview: {
          users: totalUsers,
          artists: totalArtists,
          songs: totalSongs,
          albums: totalAlbums,
          playlists: totalPlaylists,
          premiumUsers,
          publishedSongs,
          pendingSongs,
          featuredPlaylists,
        },

        growth: {
          users: {
            current: currentUsers,
            previous: previousUsers,
            percentage: getGrowthPercentage(currentUsers, previousUsers),
          },
          songs: {
            current: currentSongs,
            previous: previousSongs,
            percentage: getGrowthPercentage(currentSongs, previousSongs),
          },
        },

        charts: {
          users: userGrowthChart,
          songs: songGrowthChart,
          albums: albumGrowthChart,
          playlists: playlistGrowthChart,
        },

        topContent: {
          songs: topSongs,
          artists: topArtists,
          albums: topAlbums,
          playlists: topPlaylists,
        },
      },
    });
  } catch (error) {
    console.error("Full analytics dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardOverview,
  getDashboardCharts,

  // Aliases used by adminRoutes.js
  getPlatformStats: getPlatformStatistics,
  getTopContent: getTopContentAnalytics,
  getStatusAnalytics: getContentStatusAnalytics,
  getRecentActivity: getRecentActivityAnalytics,
  getFullDashboardAnalytics: getFullAnalyticsDashboard,

  // Same names
  getGenreAnalytics,
  getLanguageAnalytics,
  getGrowthAnalytics,
  getRevenueAnalytics,
};
