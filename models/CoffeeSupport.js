const mongoose = require("mongoose");

const coffeeSupportSchema = new mongoose.Schema(
  {
    supporterId: {
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
      required: true,
      default: 10,
    },

    message: {
      type: String,
      default: "",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CoffeeSupport",
  coffeeSupportSchema
);