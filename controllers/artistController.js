const Artist = require("../models/Artist");
const User = require("../models/User");
const Song = require("../models/Song");
const Album = require("../models/Album");

const createArtistProfile = async (req, res) => {
  try {
    const { stageName, bio } = req.body;

    const existingArtist = await Artist.findOne({ userId: req.user.id });

    if (existingArtist) {
      return res.status(400).json({
        success: false,
        message: "Artist profile already exists",
      });
    }

    if (!stageName) {
      return res.status(400).json({
        success: false,
        message: "Stage name is required",
      });
    }

    const artist = await Artist.create({
      userId: req.user.id,
      stageName,
      bio: bio || "",
      profileImage: req.files?.profileImage?.[0]?.location || "",
      coverImage: req.files?.coverImage?.[0]?.location || "",
    });

    await User.findByIdAndUpdate(req.user.id, {
      role: "artist",
    });

    res.status(201).json({
      success: true,
      message: "Artist profile created successfully",
      artist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Artist profile creation failed",
      error: error.message,
    });
  }
};

const followArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    const userId = req.user.id;

    const artist = await Artist.findById(artistId);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fix for old users/artists created before these fields existed
    if (!user.followingArtists) {
      user.followingArtists = [];
    }

    if (!artist.followers) {
      artist.followers = [];
    }

    const alreadyFollowing = user.followingArtists.some(
      (id) => id.toString() === artistId
    );

    if (alreadyFollowing) {
      user.followingArtists = user.followingArtists.filter(
        (id) => id.toString() !== artistId
      );

      artist.followers = artist.followers.filter(
        (id) => id.toString() !== userId
      );

      artist.followersCount = artist.followers.length;

      await user.save();
      await artist.save();

      return res.status(200).json({
        success: true,
        message: "Artist unfollowed successfully",
        following: false,
        followersCount: artist.followersCount,
      });
    }

    user.followingArtists.push(artistId);
    artist.followers.push(userId);

    artist.followersCount = artist.followers.length;

    await user.save();
    await artist.save();

    res.status(200).json({
      success: true,
      message: "Artist followed successfully",
      following: true,
      followersCount: artist.followersCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Follow artist failed",
      error: error.message,
    });
  }
};

const getFollowingArtists = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "followingArtists",
      "stageName bio profileImage coverImage isVerified followersCount totalStreams monthlyListeners"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.followingArtists) {
      user.followingArtists = [];
    }

    res.status(200).json({
      success: true,
      count: user.followingArtists.length,
      followingArtists: user.followingArtists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch following artists",
      error: error.message,
    });
  }
};

const getArtistProfile = async (req, res) => {
  try {
    const { artistId } = req.params;

    const artist = await Artist.findById(artistId).populate(
      "userId",
      "name email"
    );

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    if (!artist.followers) {
      artist.followers = [];
    }

    const songs = await Song.find({
      artistId,
      isPublished: true,
    }).sort({ createdAt: -1 });

    const albums = await Album.find({
      artistId,
      isPublished: true,
    }).sort({ createdAt: -1 });

    const isFollowing = artist.followers.some(
      (id) => id.toString() === req.user.id
    );

    res.status(200).json({
      success: true,
      artist,
      isFollowing,
      songs,
      albums,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch artist profile",
      error: error.message,
    });
  }
};

const updateMyArtistProfile = async (req, res) => {
  try {
    const { stageName, bio } = req.body;

    const artist = await Artist.findOne({ userId: req.user.id });

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist profile not found",
      });
    }

    if (stageName) artist.stageName = stageName;
    if (bio) artist.bio = bio;

    if (req.files?.profileImage?.[0]?.location) {
      artist.profileImage = req.files.profileImage[0].location;
    }

    if (req.files?.coverImage?.[0]?.location) {
      artist.coverImage = req.files.coverImage[0].location;
    }

    await artist.save();

    res.status(200).json({
      success: true,
      message: "Artist profile updated successfully",
      artist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Artist profile update failed",
      error: error.message,
    });
  }
};


module.exports = {
  createArtistProfile,
  updateMyArtistProfile ,
  followArtist,
  getFollowingArtists,
  getArtistProfile,
};