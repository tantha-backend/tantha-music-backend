const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    stageName: {
      type: String,
      required: true,
      trim: true,
    },

    bio: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    followersCount: {
      type: Number,
      default: 0,
    },

    totalStreams: {
      type: Number,
      default: 0,
    },

    monthlyListeners: {
      type: Number,
      default: 0,
    },

    coffeeReceived: {
      type: Number,
      default: 0,
    },

    fanClubSubscribers: {
      type: Number,
      default: 0,
    },

    fanClubPrice: {
      type: Number,
      default: 99,
    },

    isMonetized: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Artist", artistSchema);