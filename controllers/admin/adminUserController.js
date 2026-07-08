const bcrypt = require("bcryptjs");

const User = require("../../models/User");
const Artist = require("../../models/Artist");
const Song = require("../../models/Song");
const Playlist = require("../../models/Playlist");
const ListeningHistory = require("../../models/ListeningHistory");

const buildUserSearchFilter = ({ search, role, status, premium }) => {
  const filter = {};

  if (search && search.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { email: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (role && role !== "all") {
    filter.role = role;
  }

  if (status && status !== "all") {
    filter.status = status;
  }

  if (premium && premium !== "all") {
    filter.isPremium = premium === "true";
  }

  return filter;
};

const getAdminUsers = async (req, res) => {
  try {
    const {
      search = "",
      role = "all",
      status = "all",
      premium = "all",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = buildUserSearchFilter({
      search,
      role,
      status,
      premium,
    });

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.max(Number(limit) || 10, 1);
    const skip = (currentPage - 1) * pageLimit;

    const [users, totalFilteredUsers, stats] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      User.countDocuments(filter),

      Promise.all([
        User.countDocuments(),
        User.countDocuments({ isPremium: true }),
        User.countDocuments({ role: "artist" }),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ status: "active" }),
        User.countDocuments({ status: "suspended" }),
      ]),
    ]);

    const [
      totalUsers,
      premiumUsers,
      artists,
      admins,
      activeUsers,
      suspendedUsers,
    ] = stats;

    return res.status(200).json({
      success: true,
      count: users.length,
      stats: {
        totalUsers,
        premiumUsers,
        artists,
        admins,
        activeUsers,
        suspendedUsers,
      },
      pagination: {
        currentPage,
        totalPages: Math.ceil(totalFilteredUsers / pageLimit) || 1,
        totalItems: totalFilteredUsers,
        limit: pageLimit,
      },
      users,
    });
  } catch (error) {
    console.error("Get admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "user",
      status = "active",
      isPremium = false,
      premiumExpiresAt = null,
      profileImage = "",
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const allowedRoles = ["user", "artist", "admin"];
    const allowedStatuses = ["active", "suspended", "deactivated"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      status,
      isPremium: Boolean(isPremium),
      premiumExpiresAt: isPremium ? premiumExpiresAt || null : null,
      profileImage,
      lastLogin: null,
    });

    const createdUser = await User.findById(user._id)
      .select("-password")
      .lean();

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: createdUser,
    });
  } catch (error) {
    console.error("Create admin user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get admin user by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      role,
      status,
      isPremium,
      premiumExpiresAt,
      profileImage,
    } = req.body;

    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (isPremium !== undefined) updateData.isPremium = isPremium;
    if (premiumExpiresAt !== undefined) {
      updateData.premiumExpiresAt = premiumExpiresAt || null;
    }
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .lean();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update admin user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user && req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await Artist.deleteOne({ userId: id });
    await Playlist.deleteMany({ userId: id });
    await ListeningHistory.deleteMany({ userId: id });

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["user", "artist", "admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      {
        new: true,
        runValidators: true,
      },
    )
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

const togglePremium = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPremium, premiumExpiresAt } = req.body;

    const updateData = {
      isPremium: Boolean(isPremium),
      premiumExpiresAt: isPremium ? premiumExpiresAt || null : null,
    };

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: user.isPremium
        ? "Premium enabled successfully"
        : "Premium removed successfully",
      user,
    });
  } catch (error) {
    console.error("Toggle premium error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update premium status",
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["active", "suspended", "deactivated"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    if (req.user && req.user.id === id && status !== "active") {
      return res.status(400).json({
        success: false,
        message: "You cannot suspend or deactivate your own account",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      },
    )
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User status updated successfully",
      user,
    });
  } catch (error) {
    console.error("Toggle user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [playlistsCount, listeningHistoryCount, artistProfile] =
      await Promise.all([
        Playlist.countDocuments({ userId: id }),
        ListeningHistory.countDocuments({ userId: id }),
        Artist.findOne({ userId: id }).lean(),
      ]);

    const likedSongsCount = user.likedSongs?.length || 0;
    const followingArtistsCount = user.followingArtists?.length || 0;

    let artistAnalytics = {};

    if (artistProfile) {
      const artistSongs = await Song.find({
        artistId: artistProfile._id,
      }).lean();

      const totalStreams = artistSongs.reduce(
        (sum, song) => sum + (song.playCount || 0),
        0,
      );

      const totalLikes = artistSongs.reduce(
        (sum, song) => sum + (song.likes?.length || 0),
        0,
      );

      artistAnalytics = {
        artistId: artistProfile._id,
        stageName: artistProfile.stageName,
        followers: artistProfile.followers?.length || 0,
        followersCount: artistProfile.followers?.length || 0,
        monthlyListeners: artistProfile.monthlyListeners || 0,
        totalSongs: artistSongs.length,
        songsCount: artistSongs.length,
        totalStreams,
        streams: totalStreams,
        totalLikes,
      };
    }

    return res.status(200).json({
      success: true,
      analytics: {
        likedSongsCount,
        playlistsCount,
        followingArtistsCount,
        listeningHistoryCount,
        likedSongs: likedSongsCount,
        playlists: playlistsCount,
        followingArtists: followingArtistsCount,
        listeningHistory: listeningHistoryCount,
        ...artistAnalytics,
      },
    });
  } catch (error) {
    console.error("Get user analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user analytics",
    });
  }
};

module.exports = {
  getAdminUsers,
  createAdminUser,
  getAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  updateUserRole,
  togglePremium,
  toggleUserStatus,
  getUserAnalytics,
};
