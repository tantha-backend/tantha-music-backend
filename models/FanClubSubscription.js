const mongoose = require("mongoose");

const fanClubSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },

    amount: {
      type: Number,
      default: 99,
    },

    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "FanClubSubscription",
  fanClubSubscriptionSchema
);