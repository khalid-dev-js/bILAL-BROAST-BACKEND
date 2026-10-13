const mongoose = require('mongoose')

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  nameSnapshot: { type: String, required: true },
  imageSnapshot: { type: String },
  priceSnapshot: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false })

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [CartItemSchema],
  subtotal: { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.models.Cart || mongoose.model('Cart', CartSchema)
