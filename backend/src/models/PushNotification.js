const mongoose = require('mongoose')

const PushNotificationSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  status: { type: String, enum: ['pending', 'sending', 'sent', 'failed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  deliveredSubscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PushSubscription' }],
  lockedUntil: { type: Date },
  nextAttemptAt: { type: Date, default: Date.now },
  sentAt: { type: Date },
}, { timestamps: true })

module.exports = mongoose.models.PushNotification || mongoose.model('PushNotification', PushNotificationSchema)
