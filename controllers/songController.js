const Song = require("../models/Song");
const Artist = require("../models/Artist");
const User = require("../models/User");
const ListeningHistory = require("../models/ListeningHistory");

const createSong = async (req, res) => {
  try {
    console.log("UPLOAD BODY:", req.body);
    console.log("UPLOAD FILES:", req.files);
    console.log("UPLOAD USER:", req.user);

    const artist = await Artist.findOne({ userId: req.user.id });

    if (!artist) {
      return res.status(403).json({
        success: false,
        message: "Only artists can upload songs",
      });
    }

    const { title, duration, genre, language, lyrics, isPremiumOnly } = req.body;

    if (!title || !duration || !genre || !language) {
      return res.status(400).json({
        success: false,
        message: "Title, duration, genre and language are required",
        receivedBody: req.body,
      });
    }

    if (!req.files || !req.files.audio128) {
      return res.status(400).json({
        success: false,
        message: "audio128 file is required",
        receivedFiles: req.files,
      });
    }

    const song = await Song.create({
      title,
      artistId: artist._id,
      audio128: req.files.audio128[0].location,
      audio64: "",
      audio320: req.files.audio320?.[0]?.location || "",
      coverImage: req.files.coverImage?.[0]?.location || "",
      duration,
      genre,
      language,
      lyrics: lyrics || "",
      isPremiumOnly: isPremiumOnly === "true" || isPremiumOnly === true,
      isPublished: false,
    });

    res.status(201).json({
      success: true,
      message: "Song submitted for admin approval",
      song,
    });
  } catch (error) {
    console.log("SONG UPLOAD ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Song upload failed",
      error: error.message,
    });
  }
};