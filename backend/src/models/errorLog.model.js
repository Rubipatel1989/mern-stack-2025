const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['error', 'warning', 'critical', 'info'],
      default: 'error',
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Error message is required'],
    },
    stack: {
      type: String,
    },
    statusCode: {
      type: Number,
      default: 500,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    request: {
      method: String,
      url: String,
      path: String,
      query: mongoose.Schema.Types.Mixed,
      params: mongoose.Schema.Types.Mixed,
      body: mongoose.Schema.Types.Mixed,
      headers: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ module: 1, level: 1 });
errorLogSchema.index({ resolved: 1, createdAt: -1 });
errorLogSchema.index({ user: 1 });

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

module.exports = ErrorLog;

