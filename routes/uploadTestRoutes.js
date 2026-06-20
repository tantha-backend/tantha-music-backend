const express = require("express");
const uploadToS3 = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
  "/song",
  uploadToS3.fields([
    { name: "audio128", maxCount: 1 },
    { name: "audio320", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      files: req.files,
    });
  }
);

module.exports = router;