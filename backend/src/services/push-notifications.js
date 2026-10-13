const webPush = require('web-push')
const Order = require('../models/Order')
const User = require('../models/User')
const PushSubscription = require('../models/PushSubscription')
const PushNotification = require('../models/PushNotification')
const { vapidPublicKey, vapidPrivateKey, vapidSubject } = require('../config/env')

let vapidConfigured = false

function configureVapid() {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    throw new Error('VAPID configuration is incomplete')
  }
  if (!vapidConfigured) {
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
    vapidConfigured = true
  }
}

async function getNotificationEvent(orderId) {
  try {
    return await PushNotification.findOneAndUpdate(
      { orderId },
      { $setOnInsert: { orderId, status: 'pending', nextAttemptAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
  } catch (error) {
    if (error.code !== 11000) throw error
    return PushNotification.findOne({ orderId })
  }
}

async function sendToSubscription(subscription, eventId, payload) {
  try {
    await webPush.sendNotification(subscription, payload, { TTL: 86400, urgency: 'high' })
    await PushNotification.updateOne(
      { _id: eventId },
      { $addToSet: { deliveredSubscriptions: subscription._id } },
    )
    return 'delivered'
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      await PushSubscription.deleteOne({ _id: subscription._id })
      return 'expired'
    }
    return 'failed'
  }
}

async function deliverOrderNotification(event, order) {
  if (!event || event.status === 'sent') return

  const now = new Date()
  const claim = await PushNotification.findOneAndUpdate({
    _id: event._id,
    $or: [
      { status: 'pending' },
      { status: 'failed', nextAttemptAt: { $lte: now } },
      { status: 'sending', lockedUntil: { $lte: now } },
    ],
  }, {
    $set: { status: 'sending', lockedUntil: new Date(now.getTime() + 60_000) },
    $inc: { attempts: 1 },
  }, { new: true })
  if (!claim) return

  try {
    configureVapid()
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean()
    const adminIds = admins.map((admin) => admin._id)
    const subscriptions = adminIds.length
      ? await PushSubscription.find({
        user: { $in: adminIds },
        _id: { $nin: claim.deliveredSubscriptions },
      }).lean()
      : []

    if (!subscriptions.length) {
      await PushNotification.updateOne(
        { _id: claim._id },
        { $set: { status: 'sent', sentAt: new Date(), lockedUntil: null, nextAttemptAt: null } },
      )
      return
    }

    const amount = Number(order.grandTotal)
    const amountText = Number.isFinite(amount) ? ` · Rs ${amount.toLocaleString('en-PK')}` : ''
    const payload = JSON.stringify({
      title: '🔔 New Order Received!',
      body: `Order #${order.orderNumber}${amountText}`,
      orderId: String(order._id),
      url: `/dashboard/live-orders?order=${encodeURIComponent(String(order._id))}`,
    })

    const results = await Promise.all(subscriptions.map((subscription) => sendToSubscription(subscription, claim._id, payload)))
    const failed = results.filter((result) => result === 'failed').length
    if (failed) {
      await PushNotification.updateOne({ _id: claim._id }, {
        $set: {
          status: 'failed',
          lockedUntil: null,
          nextAttemptAt: new Date(Date.now() + 30_000),
        },
      })
      console.error('[push] New-order notification delivery failed', { orderId: String(order._id), failedSubscriptions: failed })
      return
    }

    await PushNotification.updateOne({ _id: claim._id }, {
      $set: { status: 'sent', sentAt: new Date(), lockedUntil: null, nextAttemptAt: null },
    })
  } catch (error) {
    await PushNotification.updateOne({ _id: claim._id }, {
      $set: {
        status: 'failed',
        lockedUntil: null,
        nextAttemptAt: new Date(Date.now() + 30_000),
      },
    })
    console.error('[push] New-order notification could not be delivered', {
      orderId: String(order._id),
      statusCode: Number.isInteger(error.statusCode) ? error.statusCode : undefined,
    })
  }
}

async function notifyAdminsOfNewOrder(order) {
  try {
    const event = await getNotificationEvent(order._id)
    await deliverOrderNotification(event, order)
  } catch (error) {
    console.error('[push] New-order notification could not be queued', {
      orderId: String(order._id),
      statusCode: Number.isInteger(error.statusCode) ? error.statusCode : undefined,
    })
  }
}

async function retryFailedNotifications() {
  const now = new Date()
  const events = await PushNotification.find({
    $or: [
      { status: { $in: ['pending', 'failed'] }, nextAttemptAt: { $lte: now } },
      { status: 'sending', lockedUntil: { $lte: now } },
    ],
  }).sort({ createdAt: 1 }).limit(20)

  for (const event of events) {
    const order = await Order.findById(event.orderId)
    if (order) await deliverOrderNotification(event, order)
  }
  return events.length
}

module.exports = { notifyAdminsOfNewOrder, retryFailedNotifications }
