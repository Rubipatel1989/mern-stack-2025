const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare at price cannot be negative'],
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      index: true,
    },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 'text', description: 'text', category: 'text' });

productSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

