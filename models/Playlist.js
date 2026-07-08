const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    coverImage: {
      type: String,
      default: "",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],

    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Admin / Editorial Playlist Support
    createdByAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    playCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    followerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

playlistSchema.index({
  title: "text",
  description: "text",
});

module.exports = mongoose.model("Playlist", playlistSchema);