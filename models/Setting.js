const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "platform_settings",
    },

    general: {
      platformName: {
        type: String,
        default: "Tantha Music",
      },
      platformTagline: {
        type: String,
        default: "Stream Manipuri and regional music.",
      },
      supportEmail: {
        type: String,
        default: "support@tanthamusic.com",
      },
      timezone: {
        type: String,
        default: "Asia/Kolkata",
      },
    },

    storage: {
      provider: {
        type: String,
        default: "AWS S3",
      },
      bucketName: {
        type: String,
        default: "tantha-music-uploads",
      },
      region: {
        type: String,
        default: "ap-south-1",
      },
    },

    features: {
      premiumSubscriptions: {
        type: Boolean,
        default: true,
      },
      coffeeSupport: {
        type: Boolean,
        default: true,
      },
      fanClub: {
        type: Boolean,
        default: true,
      },
      artistUploads: {
        type: Boolean,
        default: true,
      },
      publicStreaming: {
        type: Boolean,
        default: true,
      },
      analyticsTracking: {
        type: Boolean,
        default: true,
      },
      userRegistration: {
        type: Boolean,
        default: true,
      },
      adminApprovalFlow: {
        type: Boolean,
        default: true,
      },
    },

    security: {
      twoFactorAuth: {
        type: Boolean,
        default: false,
      },
      strongPasswordPolicy: {
        type: Boolean,
        default: true,
      },
      adminLoginAlerts: {
        type: Boolean,
        default: true,
      },
      deviceSessionTracking: {
        type: Boolean,
        default: true,
      },
      roleBasedAccess: {
        type: Boolean,
        default: true,
      },
      apiKeyProtection: {
        type: Boolean,
        default: true,
      },
      adminSessionExpiry: {
        type: String,
        default: "7 Days",
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
      },
      lockoutDuration: {
        type: String,
        default: "15 Minutes",
      },
    },

    notifications: {
      newSongUploads: {
        type: Boolean,
        default: true,
      },
      newUserRegistrations: {
        type: Boolean,
        default: true,
      },
      securityAlerts: {
        type: Boolean,
        default: true,
      },
      systemAnnouncements: {
        type: Boolean,
        default: true,
      },
      paymentNotifications: {
        type: Boolean,
        default: true,
      },
      userFeedback: {
        type: Boolean,
        default: false,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      inAppNotifications: {
        type: Boolean,
        default: true,
      },
    },

    email: {
      smtpHost: {
        type: String,
        default: "smtp.tanthamusic.com",
      },
      smtpPort: {
        type: Number,
        default: 587,
      },
      smtpUsername: {
        type: String,
        default: "no-reply@tanthamusic.com",
      },
      smtpPassword: {
        type: String,
        default: "",
      },
      senderName: {
        type: String,
        default: "Tantha Music",
      },
      senderEmail: {
        type: String,
        default: "no-reply@tanthamusic.com",
      },
      supportEmail: {
        type: String,
        default: "support@tanthamusic.com",
      },
      encryption: {
        type: String,
        default: "TLS",
      },
    },

    streaming: {
      defaultQuality: {
        type: String,
        default: "128 kbps",
      },
      premiumQuality: {
        type: String,
        default: "320 kbps",
      },
      previewDuration: {
        type: Number,
        default: 30,
      },
      autoplay: {
        type: Boolean,
        default: true,
      },
      minimumPlaySeconds: {
        type: Number,
        default: 10,
      },
      duplicatePlayCooldown: {
        type: Number,
        default: 60,
      },
      trackAnonymousPlays: {
        type: Boolean,
        default: true,
      },
      listeningHistory: {
        type: Boolean,
        default: true,
      },
      publicStreaming: {
        type: Boolean,
        default: true,
      },
      audioNormalization: {
        type: Boolean,
        default: true,
      },
    },

    uploads: {
      maxAudioFileSizeMB: {
        type: Number,
        default: 50,
      },
      maxCoverImageSizeMB: {
        type: Number,
        default: 10,
      },
      maxSongDurationMinutes: {
        type: Number,
        default: 15,
      },
      audioFormat: {
        type: String,
        default: "MP3",
      },
      coverImageFormat: {
        type: String,
        default: "JPG / JPEG",
      },
      compression: {
        type: String,
        default: "Automatic",
      },
      adminApprovalRequired: {
        type: Boolean,
        default: true,
      },
      automaticAudioProcessing: {
        type: Boolean,
        default: true,
      },
      automaticCoverOptimization: {
        type: Boolean,
        default: true,
      },
      allowArtistUploads: {
        type: Boolean,
        default: true,
      },
    },

    maintenance: {
      enabled: {
        type: Boolean,
        default: false,
      },
      message: {
        type: String,
        default:
          "Tantha Music is currently undergoing scheduled maintenance. We'll be back shortly with improvements.",
      },
      startTime: {
        type: Date,
        default: null,
      },
      endTime: {
        type: Date,
        default: null,
      },
      accessMode: {
        type: String,
        default: "Admins Only",
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Setting", settingSchema);
