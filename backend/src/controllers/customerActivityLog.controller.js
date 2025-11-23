const CustomerActivityLog = require('../models/customerActivityLog.model');
const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get all customer activity logs (Admin only)
 */
exports.getAllActivityLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    userId,
    action,
    startDate,
    endDate,
    search,
  } = req.query;

  const query = {};

  // Filter by user if provided (can be email or ObjectId)
  if (userId) {
    // Check if userId is a valid ObjectId format
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    
    if (isValidObjectId) {
      // If it's a valid ObjectId, use it directly
      query.user = userId;
    } else {
      // If it's not an ObjectId (likely an email), find user by email first
      const user = await User.findOne({ email: { $regex: userId, $options: 'i' } }).select('_id');
      if (user) {
        query.user = user._id;
      } else {
        // If user not found, return empty results
        query.user = null;
      }
    }
  }

  // Filter by action if provided
  if (action) {
    query.action = action;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // Search in description or metadata
  if (search) {
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      { 'metadata.path': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    CustomerActivityLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CustomerActivityLog.countDocuments(query),
  ]);

  sendSuccess(res, {
    data: logs,
    message: 'Activity logs retrieved successfully',
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get activity logs for a specific user
 */
exports.getUserActivityLogs = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 50,
    action,
    startDate,
    endDate,
  } = req.query;

  const query = { user: userId };

  if (action) {
    query.action = action;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    CustomerActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CustomerActivityLog.countDocuments(query),
  ]);

  sendSuccess(res, {
    data: logs,
    message: 'User activity logs retrieved successfully',
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get activity statistics
 */
exports.getActivityStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate, userId } = req.query;

  const matchQuery = {};
  if (userId) {
    // Check if userId is a valid ObjectId format
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    
    if (isValidObjectId) {
      matchQuery.user = userId;
    } else {
      // If it's not an ObjectId (likely an email), find user by email first
      const user = await User.findOne({ email: { $regex: userId, $options: 'i' } }).select('_id');
      if (user) {
        matchQuery.user = user._id;
      } else {
        // If user not found, return empty results
        matchQuery.user = null;
      }
    }
  }
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) {
      matchQuery.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      matchQuery.createdAt.$lte = new Date(endDate);
    }
  }

  const stats = await CustomerActivityLog.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const totalLogs = await CustomerActivityLog.countDocuments(matchQuery);

  sendSuccess(res, {
    data: {
      statistics: stats,
      totalLogs,
    },
    message: 'Activity statistics retrieved successfully',
  });
});

