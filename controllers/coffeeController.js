const CoffeeSupport = require("../models/CoffeeSupport");
const Artist = require("../models/Artist");

const supportArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    const { amount, message } = req.body;

    const artist = await Artist.findById(artistId);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const support = await CoffeeSupport.create({
      supporterId: req.user.id,
      artistId,
      amount: amount || 10,
      message,
      paymentStatus: "success",
    });

    artist.coffeeReceived += amount || 10;
    await artist.save();

    res.status(201).json({
      success: true,
      message: "Artist supported successfully",
      support,
      coffeeReceived: artist.coffeeReceived,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to support artist",
      error: error.message,
    });
  }
};

const getArtistCoffeeSupports = async (req, res) => {
  try {
    const { artistId } = req.params;

    const supports = await CoffeeSupport.find({
      artistId,
      paymentStatus: "success",
    })
      .populate("supporterId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: supports.length,
      supports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch coffee supports",
      error: error.message,
    });
  }
};

module.exports = {
  supportArtist,
  getArtistCoffeeSupports,
};