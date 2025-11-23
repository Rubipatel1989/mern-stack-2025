const mongoose = require('mongoose');

const customerActivityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'view_product',
        'add_to_cart',
        'remove_from_cart',
        'update_cart',
        'place_order',
        'view_order',
        'view_orders',
        'view_invoice',
        'download_invoice',
        'reorder',
        'update_profile',
        'add_address',
        'update_address',
        'delete_address',
        'view_addresses',
        'view_cart',
        'checkout',
        'search_products',
        'filter_products',
        'view_product_details',
      ],
    },
    description: {
      type: String,
      trim: true,
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
    resourceId: {
      type: String,
      // For tracking specific resources like product ID, order ID, etc.
    },
    resourceType: {
      type: String,
      enum: ['product', 'order', 'cart', 'address', 'profile', null],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
customerActivityLogSchema.index({ user: 1, createdAt: -1 });
customerActivityLogSchema.index({ action: 1, createdAt: -1 });
customerActivityLogSchema.index({ createdAt: -1 });

customerActivityLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const CustomerActivityLog = mongoose.model('CustomerActivityLog', customerActivityLogSchema);

module.exports = CustomerActivityLog;

