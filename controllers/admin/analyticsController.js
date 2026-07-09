const User = require("../../models/User");
const Artist = require("../../models/Artist");
const Song = require("../../models/Song");
const Album = require("../../models/Album");
const Playlist = require("../../models/Playlist");

const getStartDate = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Number(days || 30));
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDateKey = (date) => {
  return date.toISOString().slice(0, 10);
};

const buildEmptyDailySeries = (days = 30) => {
  const result = [];
  const today = new Date();

  for (let i = Number(days || 30) - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);

    result.push({
      date: formatDateKey(date),
      label: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      value: 0,
      count: 0,
      streams: 0,
      revenue: 0,
    });
  }

  return result;
};

const buildDailyCreatedChart = async (Model, days = 30, extraMatch = {}) => {
  const startDate = getStartDate(days);
  const base = buildEmptyDailySeries(days);

  const rows = await Model.aggregate([
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
  ]);

  const map = new Map();

  rows.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(
      2,
      "0",
    )}-${String(item._id.day).padStart(2, "0")}`;

    map.set(key, item.count);
  });

  return base.map((item) => {
    const count = map.get(item.date) || 0;

    return {
      ...item,
      value: count,
      count,
    };
  });
};

const buildMonthlyCreatedChart = async () => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const rows = await Song.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
        streams: { $sum: { $ifNull: ["$playCount", 0] } },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  const map = new Map();

  rows.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
    map.set(key, item);
  });

  const result = [];
  const today = new Date();

  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}`;

    const found = map.get(key);

    result.push({
      date: key,
      label: date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      value: found?.count || 0,
      count: found?.count || 0,
      streams: found?.streams || 0,
      revenue: 0,
    });
  }

  return result;
};

const getArtistDisplayName = (artist) => {
  return (
    artist?.stageName || artist?.artistName || artist?.name || "Unknown Artist"
  );
};

const normalizeSong = (song) => {
  const obj = song.toObject ? song.toObject() : song;

  return {
    ...obj,
    artistName: getArtistDisplayName(obj.artistId || obj.artist),
    artist: obj.artistId || obj.artist,
    streams: obj.playCount || 0,
    likes: obj.likeCount || 0,
    revenue: obj.revenue || 0,
  };
};

const normalizeArtist = async (artist) => {
  const obj = artist.toObject ? artist.toObject() : artist;

  const [songsCount, streamsResult] = await Promise.all([
    Song.countDocuments({ artistId: obj._id }),
    Song.aggregate([
      {
        $match: {
          artistId: obj._id,
        },
      },
      {
        $group: {
          _id: null,
          streams: { $sum: { $ifNull: ["$playCount", 0] } },
          revenue: { $sum: { $ifNull: ["$revenue", 0] } },
        },
      },
    ]),
  ]);

  return {
    ...obj,
    name: getArtistDisplayName(obj),
    songs: songsCount,
    songsCount,
    followers: obj.followersCount || 0,
    followersCount: obj.followersCount || 0,
    streams: streamsResult[0]?.streams || 0,
    revenue: streamsResult[0]?.revenue || 0,
  };
};

const getDashboardOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalArtists,
      totalSongs,
      totalAlbums,
      totalPlaylists,
      premiumUsers,
      publishedSongs,
      pendingSongs,
      totalStreamsResult,
    ] = await Promise.all([
      User.countDocuments(),
      Artist.countDocuments(),
      Song.countDocuments(),
      Album.countDocuments(),
      Playlist.countDocuments(),
      User.countDocuments({ isPremium: true }),
      Song.countDocuments({ isPublished: true }),
      Song.countDocuments({ isPublished: false }),
      Song.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$playCount", 0] } },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      overview: {
        totalUsers,
        totalArtists,
        totalSongs,
        totalAlbums,
        totalPlaylists,
        premiumUsers,
        publishedSongs,
        pendingSongs,
        totalStreams: totalStreamsResult[0]?.total || 0,
        activeUsers: totalUsers,
        monthlyListeners: totalUsers,
        revenue: 0,
        users: totalUsers,
        artists: totalArtists,
        songs: totalSongs,
        albums: totalAlbums,
        playlists: totalPlaylists,
      },
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

    const [users, artists, songs, albums, playlists, monthly] =
      await Promise.all([
        buildDailyCreatedChart(User, days),
        buildDailyCreatedChart(Artist, days),
        buildDailyCreatedChart(Song, days),
        buildDailyCreatedChart(Album, days),
        buildDailyCreatedChart(Playlist, days),
        buildMonthlyCreatedChart(),
      ]);

    const streams = songs.map((item) => ({
      ...item,
      streams: item.value,
    }));

    res.status(200).json({
      success: true,
      charts: {
        users,
        artists,
        songs,
        albums,
        playlists,
        streams,
        streamChart: streams,
        dailyStreams: streams,
        timeline: streams,
        monthly,
        monthlyChart: monthly,
        performance: monthly,
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
      totalUsers,
      totalSongs,
      totalArtists,
      totalStreamsResult,
      totalLikesResult,
    ] = await Promise.all([
      User.countDocuments(),
      Song.countDocuments(),
      Artist.countDocuments(),
      Song.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$playCount", 0] } },
          },
        },
      ]),
      Song.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$likeCount", 0] } },
          },
        },
      ]),
    ]);

    const totalStreams = totalStreamsResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      platform: {
        totalUsers,
        totalSongs,
        totalArtists,
        totalStreams,
        totalSongPlays: totalStreams,
        totalSongLikes: totalLikesResult[0]?.total || 0,
        activeUsers: totalUsers,
      },
      statistics: {
        totalUsers,
        totalSongs,
        totalArtists,
        totalStreams,
        totalSongPlays: totalStreams,
        totalSongLikes: totalLikesResult[0]?.total || 0,
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

    const [songs, artistsRaw, albums, playlists] = await Promise.all([
      Song.find()
        .populate("artistId", "stageName artistName name profileImage")
        .sort({ playCount: -1, likeCount: -1, createdAt: -1 })
        .limit(limit),

      Artist.find()
        .sort({ followersCount: -1, monthlyListeners: -1, createdAt: -1 })
        .limit(limit),

      Album.find()
        .populate("artistId", "stageName artistName name profileImage")
        .sort({ totalPlays: -1, likeCount: -1, createdAt: -1 })
        .limit(limit),

      Playlist.find()
        .populate("userId", "name email role profileImage")
        .sort({ playCount: -1, followerCount: -1, createdAt: -1 })
        .limit(limit),
    ]);

    const artists = await Promise.all(artistsRaw.map(normalizeArtist));

    res.status(200).json({
      success: true,
      topContent: {
        songs: songs.map(normalizeSong),
        topSongs: songs.map(normalizeSong),
        artists,
        topArtists: artists,
        albums,
        playlists,
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
    const songGenres = await Song.aggregate([
      {
        $match: {
          genre: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$genre",
          count: { $sum: 1 },
          value: { $sum: 1 },
          totalPlays: { $sum: { $ifNull: ["$playCount", 0] } },
          totalLikes: { $sum: { $ifNull: ["$likeCount", 0] } },
        },
      },
      {
        $sort: {
          count: -1,
          totalPlays: -1,
        },
      },
    ]);

    const genres = songGenres.map((item) => ({
      name: item._id || "Unknown",
      genre: item._id || "Unknown",
      label: item._id || "Unknown",
      value: item.value || item.count || 0,
      count: item.count || 0,
      totalPlays: item.totalPlays || 0,
      totalLikes: item.totalLikes || 0,
    }));

    res.status(200).json({
      success: true,
      genres,
      genreDistribution: genres,
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
    const songLanguages = await Song.aggregate([
      {
        $match: {
          language: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$language",
          count: { $sum: 1 },
          value: { $sum: 1 },
          totalPlays: { $sum: { $ifNull: ["$playCount", 0] } },
          totalLikes: { $sum: { $ifNull: ["$likeCount", 0] } },
        },
      },
      {
        $sort: {
          count: -1,
          totalPlays: -1,
        },
      },
    ]);

    const languages = songLanguages.map((item) => ({
      name: item._id || "Unknown",
      language: item._id || "Unknown",
      label: item._id || "Unknown",
      value: item.value || item.count || 0,
      count: item.count || 0,
      totalPlays: item.totalPlays || 0,
      totalLikes: item.totalLikes || 0,
    }));

    res.status(200).json({
      success: true,
      languages,
      languageDistribution: languages,
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
      buildDailyCreatedChart(User, days),
      buildDailyCreatedChart(Artist, days),
      buildDailyCreatedChart(Song, days),
      buildDailyCreatedChart(Album, days),
      buildDailyCreatedChart(Playlist, days),
    ]);

    res.status(200).json({
      success: true,
      growth: {
        users,
        artists,
        songs,
        albums,
        playlists,
        streams: songs,
        chart: songs,
        timeline: songs,
        monthly: await buildMonthlyCreatedChart(),
        performance: await buildMonthlyCreatedChart(),
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
              count: { $sum: 1 },
            },
          },
        ]),

        Album.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),

        Playlist.aggregate([
          {
            $group: {
              _id: "$isPublic",
              count: { $sum: 1 },
            },
          },
        ]),

        User.aggregate([
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    res.status(200).json({
      success: true,
      status: {
        songs: songStatus,
        albums: albumStatus,
        playlists: playlistVisibility,
        users: userRoles,
      },
      statusAnalytics: {
        songs: songStatus,
        albums: albumStatus,
        playlists: playlistVisibility,
        users: userRoles,
      },
    });
  } catch (error) {
    console.error("Status analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch status analytics",
      error: error.message,
    });
  }
};

const getRevenueAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      revenue: {
        totalRevenue: 0,
        revenue: 0,
        amount: 0,
        premiumRevenue: 0,
        coffeeRevenue: 0,
        fanClubRevenue: 0,
        platformRevenue: 0,
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

    const [users, artists, songs, albums, playlists] = await Promise.all([
      User.find()
        .select("name email role createdAt")
        .sort({ createdAt: -1 })
        .limit(limit),
      Artist.find()
        .select("stageName artistName name createdAt")
        .sort({ createdAt: -1 })
        .limit(limit),
      Song.find()
        .populate("artistId", "stageName artistName name")
        .sort({ createdAt: -1 })
        .limit(limit),
      Album.find()
        .populate("artistId", "stageName artistName name")
        .sort({ createdAt: -1 })
        .limit(limit),
      Playlist.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(limit),
    ]);

    const activities = [
      ...users.map((item) => ({
        id: item._id,
        type: "user",
        title: item.name || item.email || "New user",
        description: "User registered",
        createdAt: item.createdAt,
      })),

      ...artists.map((item) => ({
        id: item._id,
        type: "artist",
        title: getArtistDisplayName(item),
        description: "Artist profile created",
        createdAt: item.createdAt,
      })),

      ...songs.map((item) => ({
        id: item._id,
        type: "song",
        title: item.title || "New song",
        description: `Song uploaded by ${getArtistDisplayName(item.artistId)}`,
        createdAt: item.createdAt,
      })),

      ...albums.map((item) => ({
        id: item._id,
        type: "album",
        title: item.title || "New album",
        description: `Album created by ${getArtistDisplayName(item.artistId)}`,
        createdAt: item.createdAt,
      })),

      ...playlists.map((item) => ({
        id: item._id,
        type: "playlist",
        title: item.title || "New playlist",
        description: `Playlist created by ${item.userId?.name || "Admin"}`,
        createdAt: item.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      activities,
      recentActivity: activities,
      recent: activities,
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

    const [
      overviewRes,
      chartsRes,
      topContentRes,
      genresRes,
      languagesRes,
      recentRes,
    ] = await Promise.all([
      new Promise((resolve) => {
        const mockRes = { status: () => ({ json: resolve }) };
        getDashboardOverview(req, mockRes);
      }),
      new Promise((resolve) => {
        const mockReq = { query: { days } };
        const mockRes = { status: () => ({ json: resolve }) };
        getDashboardCharts(mockReq, mockRes);
      }),
      new Promise((resolve) => {
        const mockReq = { query: { limit: 10 } };
        const mockRes = { status: () => ({ json: resolve }) };
        getTopContentAnalytics(mockReq, mockRes);
      }),
      new Promise((resolve) => {
        const mockRes = { status: () => ({ json: resolve }) };
        getGenreAnalytics(req, mockRes);
      }),
      new Promise((resolve) => {
        const mockRes = { status: () => ({ json: resolve }) };
        getLanguageAnalytics(req, mockRes);
      }),
      new Promise((resolve) => {
        const mockReq = { query: { limit: 10 } };
        const mockRes = { status: () => ({ json: resolve }) };
        getRecentActivityAnalytics(mockReq, mockRes);
      }),
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        overview: overviewRes.overview || {},
        charts: chartsRes.charts || {},
        topContent: topContentRes.topContent || {},
        genres: genresRes.genres || [],
        languages: languagesRes.languages || [],
        recentActivity: recentRes.activities || [],
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
  getPlatformStats: getPlatformStatistics,
  getTopContent: getTopContentAnalytics,
  getStatusAnalytics: getContentStatusAnalytics,
  getRecentActivity: getRecentActivityAnalytics,
  getFullDashboardAnalytics: getFullAnalyticsDashboard,
  getGenreAnalytics,
  getLanguageAnalytics,
  getGrowthAnalytics,
  getRevenueAnalytics,
};