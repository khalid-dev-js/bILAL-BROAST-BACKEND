const mongoose = require('mongoose')

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  nameSnapshot: { type: String },
  imageSnapshot: { type: String },
  priceSnapshot: { type: Number },
  quantity: { type: Number },
  lineTotal: { type: Number },
}, { _id: false })

const AddressSchema = new mongoose.Schema({
  fullName: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  area: { type: String },
  notes: { type: String },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
}, { _id: false })

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerSnapshot: { userId: mongoose.Schema.Types.ObjectId, name: String, email: String, phone: String },
  customerName: { type: String, trim: true },
  isCallOrder: { type: Boolean, default: false },
  items: [OrderItemSchema],
  deliveryAddress: AddressSchema,
  paymentMethod: { type: String, enum: ['cod', 'cash', 'online'], default: 'cod' },
  source: { type: String, enum: ['customer', 'local'], default: 'customer' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  orderStatus: { type: String, enum: ['pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled'], default: 'pending' },
  subtotal: { type: Number },
  deliveryFee: { type: Number },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number },
  estimatedDeliveryTime: { type: Number },
  cancellationReason: { type: String },
}, { timestamps: true })

OrderSchema.index({ source: 1, createdAt: -1 })

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema)
