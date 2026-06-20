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

    const fanClubData =
      await FanClubSubscription.aggregate([
        {
          $group: {
            _id: null,
            totalFanClubRevenue: {
              $sum: "$amount",
            },
          },
        },
      ]);

    res.status(200).json({
      success: true,

      analytics: {
        totalUsers,
        totalArtists,
        totalSongs,
        premiumUsers,

        totalStreams:
          streamData[0]?.totalStreams || 0,

        coffeeRevenue:
          coffeeData[0]?.totalCoffeeRevenue || 0,

        fanClubRevenue:
          fanClubData[0]?.totalFanClubRevenue || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminDashboard,
};