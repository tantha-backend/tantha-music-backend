const mongoose = require("mongoose");

const premiumSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      default: 99,
    },

    plan: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PremiumSubscription",
  premiumSubscriptionSchema
);