const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
      index: true,
    },

    coverImage: { type: String, default: "" },
    bannerImage: { type: String, default: "" },

    description: { type: String, default: "", trim: true },

    genre: { type: String, default: "", trim: true, index: true },

    language: { type: String, default: "", trim: true, index: true },

    releaseDate: { type: Date, default: Date.now, index: true },

    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],

    totalPlays: { type: Number, default: 0, min: 0 },
    likeCount: { type: Number, default: 0, min: 0 },
    saveCount: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },

    labelName: { type: String, default: "Tantha Music", trim: true },
    copyrightLine: { type: String, default: "", trim: true },

    isPublished: { type: Boolean, default: false, index: true },

    status: {
      type: String,
      enum: ["draft", "published", "unpublished", "archived"],
      default: "draft",
      index: true,
    },

    isPremiumOnly: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isCoffeeSupportEnabled: { type: Boolean, default: true },
    isFanClubExclusive: { type: Boolean, default: false },
  },
  { timestamps: true },
);

albumSchema.index(
  {
    title: "text",
    description: "text",
    genre: "text",
    labelName: "text",
  },
  {
    default_language: "none",
    language_override: "_language",
  },
);

module.exports = mongoose.model("Album", albumSchema);