const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },

    albumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      default: null,
    },

    coverImage: {
      type: String,
      default: "",
    },

    audio64: {
      type: String,
      default: "",
    },

    audio128: {
      type: String,
      required: true,
    },

    audio320: {
      type: String,
      default: "",
    },

    duration: {
      type: Number,
      required: true,
    },

    genre: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      required: true,
      default: "Manipuri",
    },

    lyrics: {
      type: String,
      default: "",
    },

    playCount: {
      type: Number,
      default: 0,
    },

    likeCount: {
      type: Number,
      default: 0,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    commentCount: {
      type: Number,
      default: 0,
    },

    isPremiumOnly: {
      type: Boolean,
      default: false,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "published", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Song", songSchema);