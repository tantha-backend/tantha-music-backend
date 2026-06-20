const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },

    coverImage: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    releaseDate: {
      type: Date,
      default: Date.now,
    },

    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],

    totalPlays: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Album", albumSchema);