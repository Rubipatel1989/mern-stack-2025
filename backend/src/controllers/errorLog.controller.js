const ErrorLog = require('../models/errorLog.model');
const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get all error logs (Admin only)
 */
exports.getAllErrorLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    module: moduleFilter,
    level,
    resolved,
    userId,
    startDate,
    endDate,
    search,
  } = req.query;

  const query = {};

  // Filter by module if provided
  if (moduleFilter) {
    query.module = { $regex: moduleFilter, $options: 'i' };
  }

  // Filter by level if provided
  if (level) {
    query.level = level;
  }

  // Filter by resolved status
  if (resolved !== undefined) {
    query.resolved = resolved === 'true' || resolved === true;
  }

  // Filter by user if provided (can be email or ObjectId)
  if (userId) {
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    
    if (isValidObjectId) {
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

  // Search in message or stack
  if (search) {
    query.$or = [
      { message: { $regex: search, $options: 'i' } },
      { stack: { $regex: search, $options: 'i' } },
      { module: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    ErrorLog.find(query)
      .populate('user', 'name email role')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    ErrorLog.countDocuments(query),
  ]);

  sendSuccess(res, {
    data: logs,
    message: 'Error logs retrieved successfully',
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get error log by ID
 */
exports.getErrorLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await ErrorLog.findById(id)
    .populate('user', 'name email role')
    .populate('resolvedBy', 'name email')
    .lean();

  if (!log) {
    return sendError(res, {
      message: 'Error log not found',
      statusCode: 404,
    });
  }

  sendSuccess(res, {
    data: log,
    message: 'Error log retrieved successfully',
  });
});

/**
 * Mark error log as resolved
 */
exports.resolveErrorLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const userId = req.user.id;

  const log = await ErrorLog.findById(id);

  if (!log) {
    return sendError(res, {
      message: 'Error log not found',
      statusCode: 404,
    });
  }

  log.resolved = true;
  log.resolvedAt = new Date();
  log.resolvedBy = userId;
  if (note) {
    log.resolvedNote = note;
  }

  await log.save();

  sendSuccess(res, {
    data: log,
    message: 'Error log marked as resolved',
  });
});

/**
 * Get error statistics
 */
exports.getErrorStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate, module: moduleFilter } = req.query;

  const matchQuery = {};
  if (moduleFilter) {
    matchQuery.module = { $regex: moduleFilter, $options: 'i' };
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

  const [levelStats, moduleStats, resolvedStats, totalErrors] = await Promise.all([
    // Statistics by level
    ErrorLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    // Statistics by module
    ErrorLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    // Resolved vs Unresolved
    ErrorLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$resolved',
          count: { $sum: 1 },
        },
      },
    ]),
    // Total count
    ErrorLog.countDocuments(matchQuery),
  ]);

  sendSuccess(res, {
    data: {
      levelStatistics: levelStats,
      moduleStatistics: moduleStats,
      resolvedStatistics: resolvedStats,
      totalErrors,
    },
    message: 'Error statistics retrieved successfully',
  });
});

/**
 * Delete error log
 */
exports.deleteErrorLog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await ErrorLog.findByIdAndDelete(id);

  if (!log) {
    return sendError(res, {
      message: 'Error log not found',
      statusCode: 404,
    });
  }

  sendSuccess(res, {
    message: 'Error log deleted successfully',
  });
});

