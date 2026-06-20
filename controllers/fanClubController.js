const FanClubSubscription = require("../models/FanClubSubscription");
const Artist = require("../models/Artist");

const subscribeToArtist = async (req, res) => {
  try {
    const { artistId } = req.params;

    const artist = await Artist.findById(artistId);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const existingSubscription =
      await FanClubSubscription.findOne({
        userId: req.user.id,
        artistId,
        status: "active",
      });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "Already subscribed",
      });
    }

    const subscription =
      await FanClubSubscription.create({
        userId: req.user.id,
        artistId,
        amount: artist.fanClubPrice,
      });

    artist.fanClubSubscribers += 1;
    await artist.save();

    res.status(201).json({
      success: true,
      message: "Subscribed successfully",
      subscription,
      totalSubscribers: artist.fanClubSubscribers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Subscription failed",
      error: error.message,
    });
  }
};

const getMySubscriptions = async (req, res) => {
  try {
    const subscriptions =
      await FanClubSubscription.find({
        userId: req.user.id,
        status: "active",
      }).populate(
        "artistId",
        "stageName profileImage fanClubPrice"
      );

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions",
      error: error.message,
    });
  }
};

const getArtistSubscribers = async (req, res) => {
  try {
    const subscriptions =
      await FanClubSubscription.find({
        artistId: req.params.artistId,
        status: "active",
      }).populate(
        "userId",
        "name email"
      );

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscribers",
      error: error.message,
    });
  }
};

module.exports = {
  subscribeToArtist,
  getMySubscriptions,
  getArtistSubscribers,
};