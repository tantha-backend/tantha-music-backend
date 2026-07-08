const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const s3 = require("../config/s3");

const allowedMimeTypes = [
  // Audio
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
  "audio/flac",

  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const fileFilter = (req, file, cb) => {
  if (!file) {
    return cb(null, true);
  }

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      `Invalid file type: ${file.mimetype}. Only audio and image files are allowed.`,
    ),
  );
};

const uploadToS3 = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,

    key: (req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      let folder = "uploads";

      /*
      |--------------------------------------------------------------------------
      | Songs
      |--------------------------------------------------------------------------
      */

      if (file.fieldname === "audio128") {
        folder = "songs/audio128";
      }

      if (file.fieldname === "audio320") {
        folder = "songs/audio320";
      }

      if (
        file.fieldname === "coverImage" &&
        req.originalUrl.includes("/songs")
      ) {
        folder = "songs/covers";
      }

      /*
      |--------------------------------------------------------------------------
      | Albums
      |--------------------------------------------------------------------------
      */

      if (
        file.fieldname === "coverImage" &&
        req.originalUrl.includes("/albums")
      ) {
        folder = "albums/covers";
      }

      if (
        file.fieldname === "bannerImage" &&
        req.originalUrl.includes("/albums")
      ) {
        folder = "albums/banners";
      }

      /*
      |--------------------------------------------------------------------------
      | Artists
      |--------------------------------------------------------------------------
      */

      if (file.fieldname === "profileImage") {
        folder = "artists/profile";
      }

      if (
        file.fieldname === "coverImage" &&
        req.originalUrl.includes("/artists")
      ) {
        folder = "artists/covers";
      }

      cb(null, `${folder}/${fileName}`);
    },
  }),

  fileFilter,

  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

module.exports = uploadToS3;