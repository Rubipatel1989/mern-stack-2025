const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'State name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'State code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
stateSchema.index({ name: 1, country: 1 });
stateSchema.index({ status: 1 });

const State = mongoose.model('State', stateSchema);

module.exports = State;

