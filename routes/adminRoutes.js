const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getAdminDashboard,
} = require("../controllers/admin/dashboardController");

const {
  getAdminUsers,
  getAdminUserById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  updateUserRole,
  togglePremium,
  toggleUserStatus,
  getUserAnalytics,
} = require("../controllers/admin/adminUserController.js");

const {
  getAvailableArtistUsers,
  getAdminArtists,
  getAdminArtistById,
  getAdminArtistSongs,
  getAdminArtistAlbums,
  createAdminArtist,
  updateAdminArtist,
  deleteAdminArtist,
} = require("../controllers/admin/adminArtistController");

const {
  getAdminSongs,
  getPendingSongs,
  getAdminSongById,
  createAdminSong,
  approveSong,
  rejectSong,
  deleteSong,
} = require("../controllers/admin/adminSongController");

const {
  getAdminAlbums,
  getAdminAlbumById,
  createAdminAlbum,
  updateAdminAlbum,
  deleteAdminAlbum,
  publishAlbum,
  unpublishAlbum,
  addSongToAlbum,
  removeSongFromAlbum,
  getAlbumAnalytics,
} = require("../controllers/admin/adminAlbumController");

const {
  getAdminPlaylists,
  getAdminPlaylistById,
  createAdminPlaylist,
  updateAdminPlaylist,
  deleteAdminPlaylist,
  makePlaylistPublic,
  makePlaylistPrivate,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getPlaylistAnalytics,
} = require("../controllers/admin/adminPlaylistController");

const {
  getDashboardOverview,
  getDashboardCharts,
  getPlatformStats,
  getTopContent,
  getGenreAnalytics,
  getLanguageAnalytics,
  getGrowthAnalytics,
  getStatusAnalytics,
  getRevenueAnalytics,
  getRecentActivity,
  getFullDashboardAnalytics,
} = require("../controllers/admin/analyticsController");

const {
  getRevenueOverview,
  getPremiumSubscriptions,
  getPremiumSubscriptionById,
  updatePremiumSubscription,
  cancelPremiumSubscription,
  getCoffeeSupport,
  getCoffeeSupportById,
  getFanClubSubscriptions,
  getFanClubSubscriptionById,
  getMonthlyRevenue,
  getRevenueChart,
  getArtistEarnings,
  getTopEarningArtists,
  getPlatformRevenue,
} = require("../controllers/admin/monetizationController");

const {
  getSettings,
  updateGeneralSettings,
  updateStorageSettings,
  updateFeatureSettings,
  updateSecuritySettings,
  updateNotificationSettings,
  updateEmailSettings,
  updateStreamingSettings,
  updateUploadSettings,
  updateMaintenanceMode,
  resetSettings,
} = require("../controllers/admin/settingsController");

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard
router.get("/dashboard", getAdminDashboard);

// Users
router.get("/users", getAdminUsers);
router.get("/users/available-artists", getAvailableArtistUsers);
router.get("/users/:id", getAdminUserById);
router.post("/users/create", createAdminUser);
router.put("/users/:id", updateAdminUser);
router.delete("/users/:id", deleteAdminUser);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/premium", togglePremium);
router.put("/users/:id/status", toggleUserStatus);
router.get("/users/:id/analytics", getUserAnalytics);

// Artists
router.get("/artists", getAdminArtists);
router.get("/artists/:id", getAdminArtistById);
router.get("/artists/:id/songs", getAdminArtistSongs);
router.get("/artists/:id/albums", getAdminArtistAlbums);
router.post("/artists/create", createAdminArtist);
router.put("/artists/:id", updateAdminArtist);
router.delete("/artists/:id", deleteAdminArtist);

// Songs
router.get("/songs", getAdminSongs);
router.get("/songs/pending", getPendingSongs);
router.get("/songs/:id", getAdminSongById);

router.post(
  "/songs/create",
  upload.fields([
    { name: "audio128", maxCount: 1 },
    { name: "audio320", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  createAdminSong,
);

router.put("/songs/:id/approve", approveSong);
router.put("/songs/:id/reject", rejectSong);
router.delete("/songs/:id", deleteSong);

// Albums
router.get("/albums", getAdminAlbums);
router.get("/albums/:id", getAdminAlbumById);

router.post(
  "/albums/create",
  upload.fields([{ name: "cover", maxCount: 1 }]),
  createAdminAlbum,
);

router.put(
  "/albums/:id",
  upload.fields([{ name: "cover", maxCount: 1 }]),
  updateAdminAlbum,
);

router.delete("/albums/:id", deleteAdminAlbum);
router.put("/albums/:id/publish", publishAlbum);
router.put("/albums/:id/unpublish", unpublishAlbum);
router.put("/albums/:id/songs/add", addSongToAlbum);
router.put("/albums/:id/songs/remove", removeSongFromAlbum);
router.get("/albums/:id/analytics", getAlbumAnalytics);

// Playlists
router.get("/playlists", getAdminPlaylists);
router.get("/playlists/:id", getAdminPlaylistById);

router.post(
  "/playlists/create",
  upload.fields([{ name: "cover", maxCount: 1 }]),
  createAdminPlaylist,
);

router.put(
  "/playlists/:id",
  upload.fields([{ name: "cover", maxCount: 1 }]),
  updateAdminPlaylist,
);

router.delete("/playlists/:id", deleteAdminPlaylist);
router.put("/playlists/:id/public", makePlaylistPublic);
router.put("/playlists/:id/private", makePlaylistPrivate);
router.put("/playlists/:id/songs/add", addSongToPlaylist);
router.put("/playlists/:id/songs/remove", removeSongFromPlaylist);
router.get("/playlists/:id/analytics", getPlaylistAnalytics);

// Analytics
router.get("/analytics/overview", getDashboardOverview);
router.get("/analytics/charts", getDashboardCharts);
router.get("/analytics/platform", getPlatformStats);
router.get("/analytics/top-content", getTopContent);
router.get("/analytics/genres", getGenreAnalytics);
router.get("/analytics/languages", getLanguageAnalytics);
router.get("/analytics/growth", getGrowthAnalytics);
router.get("/analytics/status", getStatusAnalytics);
router.get("/analytics/revenue", getRevenueAnalytics);
router.get("/analytics/recent-activity", getRecentActivity);
router.get("/analytics/dashboard", getFullDashboardAnalytics);

// Monetization
router.get("/monetization/overview", getRevenueOverview);
router.get("/monetization/revenue", getPlatformRevenue);
router.get("/monetization/revenue/monthly", getMonthlyRevenue);
router.get("/monetization/revenue/chart", getRevenueChart);

router.get("/monetization/premium", getPremiumSubscriptions);
router.get("/monetization/premium/:id", getPremiumSubscriptionById);
router.put("/monetization/premium/:id", updatePremiumSubscription);
router.put("/monetization/premium/:id/cancel", cancelPremiumSubscription);

router.get("/monetization/coffee", getCoffeeSupport);
router.get("/monetization/coffee/:id", getCoffeeSupportById);

router.get("/monetization/fanclub", getFanClubSubscriptions);
router.get("/monetization/fanclub/:id", getFanClubSubscriptionById);

router.get("/monetization/artists", getArtistEarnings);
router.get("/monetization/artists/top", getTopEarningArtists);

// Settings
router.get("/settings", getSettings);

router.put("/settings/general", updateGeneralSettings);
router.put("/settings/storage", updateStorageSettings);
router.put("/settings/features", updateFeatureSettings);
router.put("/settings/security", updateSecuritySettings);
router.put("/settings/notifications", updateNotificationSettings);
router.put("/settings/email", updateEmailSettings);
router.put("/settings/streaming", updateStreamingSettings);
router.put("/settings/uploads", updateUploadSettings);
router.put("/settings/maintenance", updateMaintenanceMode);

router.post("/settings/reset", resetSettings);

module.exports = router;
