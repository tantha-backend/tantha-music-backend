const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "artist", "admin"],
      default: "user",
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    likedSongs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],

    isPremium: {
  type: Boolean,
  default: false,
},

premiumExpiresAt: {
  type: Date,
  default: null,
},

    followingArtists: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Artist",
  },
],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);