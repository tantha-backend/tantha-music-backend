const Song = require("../../models/Song");
const Artist = require("../../models/Artist");
const Album = require("../../models/Album");
const User = require("../../models/User");

const notificationController = require("../notificationController");

const createNotification =
  notificationController.createNotification || (async () => null);

const getArtistDisplayName = (artist) => {
  return (
    artist?.stageName ||
    artist?.artistName ||
    artist?.name ||
    artist?.email ||
    "Unknown Artist"
  );
};

const getAvailableArtistUsers = async (req, res) => {
  try {
    const existingArtists = await Artist.find().select("userId");

    const artistUserIds = existingArtists.map((artist) => artist.userId);

    const users = await User.find({
      role: "user",
      _id: { $nin: artistUserIds },
    })
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get available artist users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available artist users",
      error: error.message,
    });
  }
};

const getAdminArtists = async (req, res) => {
  try {
    const artists = await Artist.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: artists.length,
      artists,
    });
  } catch (error) {
    console.error("Get admin artists error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch artists",
      error: error.message,
    });
  }
};

const getAdminArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id).populate(
      "userId",
      "name email role",
    );

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    return res.status(200).json({
      success: true,
      artist,
    });
  } catch (error) {
    console.error("Get admin artist by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch artist",
      error: error.message,
    });
  }
};

const getAdminArtistSongs = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const songs = await Song.find({
      artistId: artist._id,
    })
      .populate("albumId", "title coverImage")
      .sort({ createdAt: -1 });

    const stats = {
      totalSongs: songs.length,
      publishedSongs: songs.filter((song) => song.isPublished).length,
      draftSongs: songs.filter((song) => !song.isPublished).length,
      totalStreams: songs.reduce((sum, song) => sum + (song.playCount || 0), 0),
      totalLikes: songs.reduce((sum, song) => sum + (song.likeCount || 0), 0),
      premiumSongs: songs.filter((song) => song.isPremiumOnly).length,
    };

    return res.status(200).json({
      success: true,
      artist: {
        _id: artist._id,
        stageName: artist.stageName,
      },
      stats,
      songs,
    });
  } catch (error) {
    console.error("Get admin artist songs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch artist songs",
      error: error.message,
    });
  }
};

const getAdminArtistAlbums = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const albums = await Album.find({
      artistId: artist._id,
    })
      .populate("songs", "title playCount likeCount isPublished")
      .sort({ createdAt: -1 });

    const stats = {
      totalAlbums: albums.length,
      publishedAlbums: albums.filter((album) => album.isPublished).length,
      draftAlbums: albums.filter((album) => !album.isPublished).length,
      totalAlbumPlays: albums.reduce(
        (sum, album) => sum + (album.totalPlays || 0),
        0,
      ),
      totalSongsInAlbums: albums.reduce(
        (sum, album) => sum + (album.songs?.length || 0),
        0,
      ),
    };

    return res.status(200).json({
      success: true,
      artist: {
        _id: artist._id,
        stageName: artist.stageName,
      },
      stats,
      albums,
    });
  } catch (error) {
    console.error("Get admin artist albums error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch artist albums",
      error: error.message,
    });
  }
};

const createAdminArtist = async (req, res) => {
  try {
    const { userId, stageName, bio, fanClubPrice, isVerified, isMonetized } =
      req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User is required to create an artist profile",
      });
    }

    if (!stageName) {
      return res.status(400).json({
        success: false,
        message: "Stage name is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Selected user not found",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin user cannot be converted into an artist",
      });
    }

    const existingArtist = await Artist.findOne({
      userId: user._id,
    });

    if (existingArtist) {
      return res.status(409).json({
        success: false,
        message: "This user already has an artist profile",
      });
    }

    const profileImage = req.files?.profileImage?.[0]?.location || "";
    const coverImage = req.files?.coverImage?.[0]?.location || "";

    const artist = await Artist.create({
      userId: user._id,
      stageName,
      bio: bio || "",
      profileImage,
      coverImage,
      isVerified: isVerified === "true" || isVerified === true,
      fanClubPrice: fanClubPrice ? Number(fanClubPrice) : 99,
      isMonetized:
        isMonetized === undefined
          ? true
          : isMonetized === "true" || isMonetized === true,
    });

    user.role = "artist";
    await user.save();

    const populatedArtist = await Artist.findById(artist._id).populate(
      "userId",
      "name email role",
    );

    await createNotification({
      userId: null,
      title: "New artist created",
      message: `${getArtistDisplayName(populatedArtist)} has been added as an artist.`,
      type: "artist",
      targetType: "artist",
      targetId: populatedArtist._id,
      link: "/artists",
    });

    return res.status(201).json({
      success: true,
      message: "Artist profile created successfully",
      artist: populatedArtist,
    });
  } catch (error) {
    console.error("Create admin artist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create artist",
      error: error.message,
    });
  }
};

const updateAdminArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const oldName = getArtistDisplayName(artist);

    const { stageName, bio, fanClubPrice, isVerified, isMonetized } = req.body;

    if (stageName !== undefined) {
      artist.stageName = stageName;
    }

    if (bio !== undefined) {
      artist.bio = bio;
    }

    if (fanClubPrice !== undefined && fanClubPrice !== "") {
      artist.fanClubPrice = Number(fanClubPrice);
    }

    if (isVerified !== undefined) {
      artist.isVerified = isVerified === "true" || isVerified === true;
    }

    if (isMonetized !== undefined) {
      artist.isMonetized = isMonetized === "true" || isMonetized === true;
    }

    if (req.files?.profileImage?.[0]?.location) {
      artist.profileImage = req.files.profileImage[0].location;
    }

    if (req.files?.coverImage?.[0]?.location) {
      artist.coverImage = req.files.coverImage[0].location;
    }

    await artist.save();

    const updatedArtist = await Artist.findById(artist._id).populate(
      "userId",
      "name email role",
    );

    await createNotification({
      userId: null,
      title: "Artist updated",
      message: `${oldName} profile has been updated.`,
      type: "artist",
      targetType: "artist",
      targetId: updatedArtist._id,
      link: `/artists/${updatedArtist._id}`,
    });

    return res.status(200).json({
      success: true,
      message: "Artist updated successfully",
      artist: updatedArtist,
    });
  } catch (error) {
    console.error("Update admin artist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update artist",
      error: error.message,
    });
  }
};

const deleteAdminArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const artistName = getArtistDisplayName(artist);

    const songsCount = await Song.countDocuments({
      artistId: artist._id,
    });

    if (songsCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete artist with existing songs",
      });
    }

    const userId = artist.userId;

    await artist.deleteOne();

    if (userId) {
      const user = await User.findById(userId);

      if (user && user.role === "artist") {
        user.role = "user";
        await user.save();
      }
    }

    await createNotification({
      userId: null,
      title: "Artist deleted",
      message: `${artistName} artist profile has been deleted.`,
      type: "artist",
      targetType: "artist",
      targetId: null,
      link: "/artists",
    });

    return res.status(200).json({
      success: true,
      message: "Artist deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin artist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete artist",
      error: error.message,
    });
  }
};

module.exports = {
  getAvailableArtistUsers,
  getAdminArtists,
  getAdminArtistById,
  getAdminArtistSongs,
  getAdminArtistAlbums,
  createAdminArtist,
  updateAdminArtist,
  deleteAdminArtist,
};