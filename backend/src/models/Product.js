const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String },
  images: [{ type: String }],
  ingredients: [{ type: String }],
  isPopular: { type: Boolean, default: false },
  isDeal: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  stockStatus: { type: String, enum: ['in_stock', 'out_of_stock', 'preorder'], default: 'in_stock' },
  preparationTime: { type: Number },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema)
