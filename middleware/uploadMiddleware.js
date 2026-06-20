const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const s3 = require("../config/s3");

const allowedMimeTypes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/mp4",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only audio and image files are allowed."));
  }
};

const uploadToS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,

    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      let folder = "uploads";

      if (file.fieldname === "audio128") folder = "songs/audio128";
      if (file.fieldname === "audio320") folder = "songs/audio320";
      if (file.fieldname === "coverImage") folder = "songs/covers";
      if (file.fieldname === "albumCover") folder = "albums/covers";
      if (file.fieldname === "profileImage") folder = "artists/profile";
      if (file.fieldname === "artistCoverImage") folder = "artists/covers";

      cb(null, `${folder}/${fileName}`);
    },
  }),

  fileFilter,

  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

module.exports = uploadToS3;