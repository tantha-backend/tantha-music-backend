const mongoose = require("mongoose");

const PremiumSubscription = require("../../models/PremiumSubscription");
const CoffeeSupport = require("../../models/CoffeeSupport");
const FanClubSubscription = require("../../models/FanClubSubscription");
const User = require("../../models/User");
const Artist = require("../../models/Artist");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const sendSuccess = (res, statusCode, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
};

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const getDateRange = (req) => {
  const { startDate, endDate } = req.query;

  const range = {};

  if (startDate || endDate) {
    range.createdAt = {};

    if (startDate) {
      const start = new Date(startDate);
      if (!Number.isNaN(start.getTime())) {
        range.createdAt.$gte = start;
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        range.createdAt.$lte = end;
      }
    }
  }

  return range;
};

const buildRevenueMatch = (req, statusField = "status") => {
  const match = {
    ...getDateRange(req),
  };

  if (req.query.status) {
    match[statusField] = req.query.status;
  }

  return match;
};

const getPreviousRange = (days = 30) => {
  const now = new Date();

  const currentStart = new Date();
  currentStart.setDate(now.getDate() - days);

  const previousStart = new Date();
  previousStart.setDate(now.getDate() - days * 2);

  const previousEnd = new Date(currentStart);

  return {
    currentStart,
    previousStart,
    previousEnd,
  };
};

const calculateGrowth = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(2));
};

const sumAmount = async (Model, match = {}) => {
  const result = await Model.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ["$amount", 0] } },
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    total: result[0]?.total || 0,
    count: result[0]?.count || 0,
  };
};

const getRevenueOverview = async (req, res) => {
  try {
    const { currentStart, previousStart, previousEnd } = getPreviousRange(30);

    const premiumCurrent = await sumAmount(PremiumSubscription, {
      createdAt: { $gte: currentStart },
      status: { $in: ["active", "completed", "paid", "success"] },
    });

    const premiumPrevious = await sumAmount(PremiumSubscription, {
      createdAt: {
        $gte: previousStart,
        $lt: previousEnd,
      },
      status: { $in: ["active", "completed", "paid", "success"] },
    });

    const coffeeCurrent = await sumAmount(CoffeeSupport, {
      createdAt: { $gte: currentStart },
      paymentStatus: { $in: ["completed", "paid", "success"] },
    });

    const coffeePrevious = await sumAmount(CoffeeSupport, {
      createdAt: {
        $gte: previousStart,
        $lt: previousEnd,
      },
      paymentStatus: { $in: ["completed", "paid", "success"] },
    });

    const fanClubCurrent = await sumAmount(FanClubSubscription, {
      createdAt: { $gte: currentStart },
      status: { $in: ["active", "completed", "paid", "success"] },
    });

    const fanClubPrevious = await sumAmount(FanClubSubscription, {
      createdAt: {
        $gte: previousStart,
        $lt: previousEnd,
      },
      status: { $in: ["active", "completed", "paid", "success"] },
    });

    const totalCurrentRevenue =
      premiumCurrent.total + coffeeCurrent.total + fanClubCurrent.total;

    const totalPreviousRevenue =
      premiumPrevious.total + coffeePrevious.total + fanClubPrevious.total;

    const totalTransactions =
      premiumCurrent.count + coffeeCurrent.count + fanClubCurrent.count;

    const activePremiumSubscriptions = await PremiumSubscription.countDocuments(
      {
        status: "active",
      },
    );

    const activeFanClubSubscriptions = await FanClubSubscription.countDocuments(
      {
        status: "active",
      },
    );

    const successfulCoffeeSupports = await CoffeeSupport.countDocuments({
      paymentStatus: { $in: ["completed", "paid", "success"] },
    });

    return sendSuccess(res, 200, {
      overview: {
        totalRevenue: totalCurrentRevenue,
        previousRevenue: totalPreviousRevenue,
        revenueGrowth: calculateGrowth(
          totalCurrentRevenue,
          totalPreviousRevenue,
        ),

        totalTransactions,

        premiumRevenue: premiumCurrent.total,
        premiumTransactions: premiumCurrent.count,
        premiumGrowth: calculateGrowth(
          premiumCurrent.total,
          premiumPrevious.total,
        ),

        coffeeRevenue: coffeeCurrent.total,
        coffeeTransactions: coffeeCurrent.count,
        coffeeGrowth: calculateGrowth(
          coffeeCurrent.total,
          coffeePrevious.total,
        ),

        fanClubRevenue: fanClubCurrent.total,
        fanClubTransactions: fanClubCurrent.count,
        fanClubGrowth: calculateGrowth(
          fanClubCurrent.total,
          fanClubPrevious.total,
        ),

        activePremiumSubscriptions,
        activeFanClubSubscriptions,
        successfulCoffeeSupports,
      },
    });
  } catch (error) {
    console.error("Get revenue overview error:", error);
    return sendError(res, 500, "Failed to fetch revenue overview");
  }
};

const getPremiumSubscriptions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const { search, status, plan } = req.query;

    const query = {
      ...getDateRange(req),
    };

    if (status) {
      query.status = status;
    }

    if (plan) {
      query.plan = plan;
    }

    let userIds = [];

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      userIds = users.map((user) => user._id);
      query.userId = { $in: userIds };
    }

    const [subscriptions, total] = await Promise.all([
      PremiumSubscription.find(query)
        .populate("userId", "name email role isPremium premiumExpiresAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PremiumSubscription.countDocuments(query),
    ]);

    return sendSuccess(res, 200, {
      count: subscriptions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      subscriptions,
    });
  } catch (error) {
    console.error("Get premium subscriptions error:", error);
    return sendError(res, 500, "Failed to fetch premium subscriptions");
  }
};

const getPremiumSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid premium subscription ID");
    }

    const subscription = await PremiumSubscription.findById(id).populate(
      "userId",
      "name email role isPremium premiumExpiresAt createdAt",
    );

    if (!subscription) {
      return sendError(res, 404, "Premium subscription not found");
    }

    return sendSuccess(res, 200, {
      subscription,
    });
  } catch (error) {
    console.error("Get premium subscription by ID error:", error);
    return sendError(res, 500, "Failed to fetch premium subscription");
  }
};

const updatePremiumSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, plan, status, expiresAt } = req.body;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid premium subscription ID");
    }

    const updateData = {};

    if (amount !== undefined) updateData.amount = amount;
    if (plan !== undefined) updateData.plan = plan;
    if (status !== undefined) updateData.status = status;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt;

    const subscription = await PremiumSubscription.findByIdAndUpdate(
      id,
      updateData,
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).populate("userId", "name email role isPremium premiumExpiresAt");

    if (!subscription) {
      return sendError(res, 404, "Premium subscription not found");
    }

    if (subscription.userId) {
      const shouldBePremium =
        subscription.status === "active" &&
        subscription.expiresAt &&
        new Date(subscription.expiresAt) > new Date();

      await User.findByIdAndUpdate(
        subscription.userId._id,
        {
          isPremium: shouldBePremium,
          premiumExpiresAt: subscription.expiresAt || null,
        },
        {
          returnDocument: "after",
        },
      );
    }

    return sendSuccess(res, 200, {
      message: "Premium subscription updated successfully",
      subscription,
    });
  } catch (error) {
    console.error("Update premium subscription error:", error);
    return sendError(res, 500, "Failed to update premium subscription");
  }
};

const cancelPremiumSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid premium subscription ID");
    }

    const subscription = await PremiumSubscription.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).populate("userId", "name email role isPremium premiumExpiresAt");

    if (!subscription) {
      return sendError(res, 404, "Premium subscription not found");
    }

    if (subscription.userId) {
      await User.findByIdAndUpdate(
        subscription.userId._id,
        {
          isPremium: false,
          premiumExpiresAt: null,
        },
        {
          returnDocument: "after",
        },
      );
    }

    return sendSuccess(res, 200, {
      message: "Premium subscription cancelled successfully",
      subscription,
    });
  } catch (error) {
    console.error("Cancel premium subscription error:", error);
    return sendError(res, 500, "Failed to cancel premium subscription");
  }
};
const getCoffeeSupport = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const { search, paymentStatus, artistId, supporterId } = req.query;

    const query = {
      ...getDateRange(req),
    };

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (artistId && isValidObjectId(artistId)) {
      query.artistId = artistId;
    }

    if (supporterId && isValidObjectId(supporterId)) {
      query.supporterId = supporterId;
    }

    if (search) {
      const [users, artists] = await Promise.all([
        User.find({
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }).select("_id"),

        Artist.find({
          $or: [
            { stageName: { $regex: search, $options: "i" } },
            { artistName: { $regex: search, $options: "i" } },
          ],
        }).select("_id"),
      ]);

      query.$or = [
        {
          supporterId: {
            $in: users.map((user) => user._id),
          },
        },
        {
          artistId: {
            $in: artists.map((artist) => artist._id),
          },
        },
        {
          message: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const [supports, total] = await Promise.all([
      CoffeeSupport.find(query)
        .populate("supporterId", "name email role")
        .populate("artistId", "stageName artistName userId profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      CoffeeSupport.countDocuments(query),
    ]);

    return sendSuccess(res, 200, {
      count: supports.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      supports,
    });
  } catch (error) {
    console.error("Get coffee support error:", error);
    return sendError(res, 500, "Failed to fetch coffee support records");
  }
};

const getCoffeeSupportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid coffee support ID");
    }

    const support = await CoffeeSupport.findById(id)
      .populate("supporterId", "name email role createdAt")
      .populate("artistId", "stageName artistName userId profileImage");

    if (!support) {
      return sendError(res, 404, "Coffee support record not found");
    }

    return sendSuccess(res, 200, {
      support,
    });
  } catch (error) {
    console.error("Get coffee support by ID error:", error);
    return sendError(res, 500, "Failed to fetch coffee support record");
  }
};

const getFanClubSubscriptions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const { search, status, artistId, userId } = req.query;

    const query = {
      ...getDateRange(req),
    };

    if (status) {
      query.status = status;
    }

    if (artistId && isValidObjectId(artistId)) {
      query.artistId = artistId;
    }

    if (userId && isValidObjectId(userId)) {
      query.userId = userId;
    }

    if (search) {
      const [users, artists] = await Promise.all([
        User.find({
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }).select("_id"),

        Artist.find({
          $or: [
            { stageName: { $regex: search, $options: "i" } },
            { artistName: { $regex: search, $options: "i" } },
          ],
        }).select("_id"),
      ]);

      query.$or = [
        {
          userId: {
            $in: users.map((user) => user._id),
          },
        },
        {
          artistId: {
            $in: artists.map((artist) => artist._id),
          },
        },
      ];
    }

    const [subscriptions, total] = await Promise.all([
      FanClubSubscription.find(query)
        .populate("userId", "name email role")
        .populate("artistId", "stageName artistName userId profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      FanClubSubscription.countDocuments(query),
    ]);

    return sendSuccess(res, 200, {
      count: subscriptions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      subscriptions,
    });
  } catch (error) {
    console.error("Get fan club subscriptions error:", error);
    return sendError(res, 500, "Failed to fetch fan club subscriptions");
  }
};

const getFanClubSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid fan club subscription ID");
    }

    const subscription = await FanClubSubscription.findById(id)
      .populate("userId", "name email role createdAt")
      .populate("artistId", "stageName artistName userId profileImage");

    if (!subscription) {
      return sendError(res, 404, "Fan club subscription not found");
    }

    return sendSuccess(res, 200, {
      subscription,
    });
  } catch (error) {
    console.error("Get fan club subscription by ID error:", error);
    return sendError(res, 500, "Failed to fetch fan club subscription");
  }
};

const getMonthlyRevenue = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const premiumRevenue = await PremiumSubscription.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          status: { $in: ["active", "completed", "paid", "success"] },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          revenue: { $sum: { $ifNull: ["$amount", 0] } },
          transactions: { $sum: 1 },
        },
      },
    ]);

    const coffeeRevenue = await CoffeeSupport.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          paymentStatus: { $in: ["completed", "paid", "success"] },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          revenue: { $sum: { $ifNull: ["$amount", 0] } },
          transactions: { $sum: 1 },
        },
      },
    ]);

    const fanClubRevenue = await FanClubSubscription.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          status: { $in: ["active", "completed", "paid", "success"] },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          revenue: { $sum: { $ifNull: ["$amount", 0] } },
          transactions: { $sum: 1 },
        },
      },
    ]);

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;

      const premium = premiumRevenue.find((item) => item._id.month === month);
      const coffee = coffeeRevenue.find((item) => item._id.month === month);
      const fanClub = fanClubRevenue.find((item) => item._id.month === month);

      const premiumAmount = premium?.revenue || 0;
      const coffeeAmount = coffee?.revenue || 0;
      const fanClubAmount = fanClub?.revenue || 0;

      const premiumTransactions = premium?.transactions || 0;
      const coffeeTransactions = coffee?.transactions || 0;
      const fanClubTransactions = fanClub?.transactions || 0;

      return {
        month,
        label: new Date(year, index, 1).toLocaleString("en-US", {
          month: "short",
        }),
        premiumRevenue: premiumAmount,
        coffeeRevenue: coffeeAmount,
        fanClubRevenue: fanClubAmount,
        totalRevenue: premiumAmount + coffeeAmount + fanClubAmount,
        premiumTransactions,
        coffeeTransactions,
        fanClubTransactions,
        totalTransactions:
          premiumTransactions + coffeeTransactions + fanClubTransactions,
      };
    });

    const totalRevenue = months.reduce(
      (sum, item) => sum + item.totalRevenue,
      0,
    );

    const totalTransactions = months.reduce(
      (sum, item) => sum + item.totalTransactions,
      0,
    );

    return sendSuccess(res, 200, {
      year,
      totalRevenue,
      totalTransactions,
      monthlyRevenue: months,
    });
  } catch (error) {
    console.error("Get monthly revenue error:", error);
    return sendError(res, 500, "Failed to fetch monthly revenue");
  }
};
const getRevenueChart = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const buildDailyPipeline = (statusField, validStatuses) => [
      {
        $match: {
          createdAt: { $gte: startDate },
          [statusField]: { $in: validStatuses },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: { $ifNull: ["$amount", 0] } },
          transactions: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ];

    const [premiumData, coffeeData, fanClubData] = await Promise.all([
      PremiumSubscription.aggregate(
        buildDailyPipeline("status", [
          "active",
          "completed",
          "paid",
          "success",
        ]),
      ),
      CoffeeSupport.aggregate(
        buildDailyPipeline("paymentStatus", ["completed", "paid", "success"]),
      ),
      FanClubSubscription.aggregate(
        buildDailyPipeline("status", [
          "active",
          "completed",
          "paid",
          "success",
        ]),
      ),
    ]);

    const getKey = (date) => date.toISOString().split("T")[0];

    const toMap = (items) => {
      const map = new Map();

      items.forEach((item) => {
        const date = new Date(item._id.year, item._id.month - 1, item._id.day);

        map.set(getKey(date), {
          revenue: item.revenue || 0,
          transactions: item.transactions || 0,
        });
      });

      return map;
    };

    const premiumMap = toMap(premiumData);
    const coffeeMap = toMap(coffeeData);
    const fanClubMap = toMap(fanClubData);

    const chart = [];

    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      date.setHours(0, 0, 0, 0);

      const key = getKey(date);

      const premium = premiumMap.get(key) || {
        revenue: 0,
        transactions: 0,
      };

      const coffee = coffeeMap.get(key) || {
        revenue: 0,
        transactions: 0,
      };

      const fanClub = fanClubMap.get(key) || {
        revenue: 0,
        transactions: 0,
      };

      chart.push({
        date: key,
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        premiumRevenue: premium.revenue,
        coffeeRevenue: coffee.revenue,
        fanClubRevenue: fanClub.revenue,
        totalRevenue: premium.revenue + coffee.revenue + fanClub.revenue,
        premiumTransactions: premium.transactions,
        coffeeTransactions: coffee.transactions,
        fanClubTransactions: fanClub.transactions,
        totalTransactions:
          premium.transactions + coffee.transactions + fanClub.transactions,
      });
    }

    const totalRevenue = chart.reduce(
      (sum, item) => sum + item.totalRevenue,
      0,
    );

    const totalTransactions = chart.reduce(
      (sum, item) => sum + item.totalTransactions,
      0,
    );

    return sendSuccess(res, 200, {
      days,
      totalRevenue,
      totalTransactions,
      chart,
    });
  } catch (error) {
    console.error("Get revenue chart error:", error);
    return sendError(res, 500, "Failed to fetch revenue chart");
  }
};

const getArtistEarnings = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { artistId } = req.query;

    const coffeeMatch = {
      paymentStatus: { $in: ["completed", "paid", "success"] },
      ...getDateRange(req),
    };

    const fanClubMatch = {
      status: { $in: ["active", "completed", "paid", "success"] },
      ...getDateRange(req),
    };

    if (artistId && isValidObjectId(artistId)) {
      coffeeMatch.artistId = new mongoose.Types.ObjectId(artistId);
      fanClubMatch.artistId = new mongoose.Types.ObjectId(artistId);
    }

    const coffeeEarnings = await CoffeeSupport.aggregate([
      { $match: coffeeMatch },
      {
        $group: {
          _id: "$artistId",
          coffeeRevenue: { $sum: { $ifNull: ["$amount", 0] } },
          coffeeSupportCount: { $sum: 1 },
        },
      },
    ]);

    const fanClubEarnings = await FanClubSubscription.aggregate([
      { $match: fanClubMatch },
      {
        $group: {
          _id: "$artistId",
          fanClubRevenue: { $sum: { $ifNull: ["$amount", 0] } },
          fanClubSubscriptionCount: { $sum: 1 },
        },
      },
    ]);

    const earningsMap = new Map();

    coffeeEarnings.forEach((item) => {
      const key = item._id?.toString();

      if (!key) return;

      earningsMap.set(key, {
        artistId: item._id,
        coffeeRevenue: item.coffeeRevenue || 0,
        coffeeSupportCount: item.coffeeSupportCount || 0,
        fanClubRevenue: 0,
        fanClubSubscriptionCount: 0,
      });
    });

    fanClubEarnings.forEach((item) => {
      const key = item._id?.toString();

      if (!key) return;

      const existing = earningsMap.get(key) || {
        artistId: item._id,
        coffeeRevenue: 0,
        coffeeSupportCount: 0,
        fanClubRevenue: 0,
        fanClubSubscriptionCount: 0,
      };

      existing.fanClubRevenue = item.fanClubRevenue || 0;
      existing.fanClubSubscriptionCount = item.fanClubSubscriptionCount || 0;

      earningsMap.set(key, existing);
    });

    let earnings = Array.from(earningsMap.values()).map((item) => ({
      ...item,
      totalRevenue: item.coffeeRevenue + item.fanClubRevenue,
      totalTransactions:
        item.coffeeSupportCount + item.fanClubSubscriptionCount,
    }));

    earnings.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const total = earnings.length;

    earnings = earnings.slice(skip, skip + limit);

    const artistIds = earnings.map((item) => item.artistId);

    const artists = await Artist.find({
      _id: { $in: artistIds },
    }).select("stageName artistName userId profileImage genre");

    const artistMap = new Map(
      artists.map((artist) => [artist._id.toString(), artist]),
    );

    const populatedEarnings = earnings.map((item) => ({
      ...item,
      artist: artistMap.get(item.artistId.toString()) || null,
    }));

    const platformTotals = Array.from(earningsMap.values()).reduce(
      (totals, item) => {
        totals.coffeeRevenue += item.coffeeRevenue || 0;
        totals.fanClubRevenue += item.fanClubRevenue || 0;
        totals.totalRevenue +=
          (item.coffeeRevenue || 0) + (item.fanClubRevenue || 0);
        totals.totalTransactions +=
          (item.coffeeSupportCount || 0) + (item.fanClubSubscriptionCount || 0);
        return totals;
      },
      {
        coffeeRevenue: 0,
        fanClubRevenue: 0,
        totalRevenue: 0,
        totalTransactions: 0,
      },
    );

    return sendSuccess(res, 200, {
      total,
      page,
      pages: Math.ceil(total / limit),
      platformTotals,
      earnings: populatedEarnings,
    });
  } catch (error) {
    console.error("Get artist earnings error:", error);
    return sendError(res, 500, "Failed to fetch artist earnings");
  }
};

const getTopEarningArtists = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const coffeeEarnings = await CoffeeSupport.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["completed", "paid", "success"] },
          ...getDateRange(req),
        },
      },
      {
        $group: {
          _id: "$artistId",
          coffeeRevenue: { $sum: { $ifNull: ["$amount", 0] } },
          coffeeSupportCount: { $sum: 1 },
        },
      },
    ]);

    const fanClubEarnings = await FanClubSubscription.aggregate([
      {
        $match: {
          status: { $in: ["active", "completed", "paid", "success"] },
          ...getDateRange(req),
        },
      },
      {
        $group: {
          _id: "$artistId",
          fanClubRevenue: { $sum: { $ifNull: ["$amount", 0] } },
          fanClubSubscriptionCount: { $sum: 1 },
        },
      },
    ]);

    const earningsMap = new Map();

    coffeeEarnings.forEach((item) => {
      const key = item._id?.toString();

      if (!key) return;

      earningsMap.set(key, {
        artistId: item._id,
        coffeeRevenue: item.coffeeRevenue || 0,
        coffeeSupportCount: item.coffeeSupportCount || 0,
        fanClubRevenue: 0,
        fanClubSubscriptionCount: 0,
      });
    });

    fanClubEarnings.forEach((item) => {
      const key = item._id?.toString();

      if (!key) return;

      const existing = earningsMap.get(key) || {
        artistId: item._id,
        coffeeRevenue: 0,
        coffeeSupportCount: 0,
        fanClubRevenue: 0,
        fanClubSubscriptionCount: 0,
      };

      existing.fanClubRevenue = item.fanClubRevenue || 0;
      existing.fanClubSubscriptionCount = item.fanClubSubscriptionCount || 0;

      earningsMap.set(key, existing);
    });

    const earnings = Array.from(earningsMap.values())
      .map((item) => ({
        ...item,
        totalRevenue: item.coffeeRevenue + item.fanClubRevenue,
        totalTransactions:
          item.coffeeSupportCount + item.fanClubSubscriptionCount,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    const artistIds = earnings.map((item) => item.artistId);

    const artists = await Artist.find({
      _id: { $in: artistIds },
    }).select("stageName artistName userId profileImage genre followersCount");

    const artistMap = new Map(
      artists.map((artist) => [artist._id.toString(), artist]),
    );

    const topArtists = earnings.map((item, index) => ({
      rank: index + 1,
      ...item,
      artist: artistMap.get(item.artistId.toString()) || null,
    }));

    return sendSuccess(res, 200, {
      count: topArtists.length,
      topArtists,
    });
  } catch (error) {
    console.error("Get top earning artists error:", error);
    return sendError(res, 500, "Failed to fetch top earning artists");
  }
};
const getPlatformRevenue = async (req, res) => {
  try {
    const premiumMatch = {
      status: { $in: ["active", "completed", "paid", "success"] },
      ...getDateRange(req),
    };

    const coffeeMatch = {
      paymentStatus: { $in: ["completed", "paid", "success"] },
      ...getDateRange(req),
    };

    const fanClubMatch = {
      status: { $in: ["active", "completed", "paid", "success"] },
      ...getDateRange(req),
    };

    const [premium, coffee, fanClub] = await Promise.all([
      sumAmount(PremiumSubscription, premiumMatch),
      sumAmount(CoffeeSupport, coffeeMatch),
      sumAmount(FanClubSubscription, fanClubMatch),
    ]);

    const grossRevenue = premium.total + coffee.total + fanClub.total;

    const totalTransactions = premium.count + coffee.count + fanClub.count;

    return sendSuccess(res, 200, {
      platformRevenue: {
        grossRevenue,
        totalTransactions,

        premium: {
          revenue: premium.total,
          transactions: premium.count,
        },

        coffee: {
          revenue: coffee.total,
          transactions: coffee.count,
        },

        fanClub: {
          revenue: fanClub.total,
          transactions: fanClub.count,
        },
      },
    });
  } catch (error) {
    console.error("Get platform revenue error:", error);
    return sendError(res, 500, "Failed to fetch platform revenue");
  }
};

module.exports = {
  getRevenueOverview,

  getPremiumSubscriptions,
  getPremiumSubscriptionById,
  updatePremiumSubscription,
  cancelPremiumSubscription,

  getCoffeeSupport,
  getCoffeeSupportById,

  getFanClubSubscriptions,
  getFanClubSubscriptionById,

  getMonthlyRevenue,
  getRevenueChart,
  getArtistEarnings,
  getTopEarningArtists,
  getPlatformRevenue,
};
