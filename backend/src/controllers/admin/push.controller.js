const PushSubscription = require('../../models/PushSubscription')

function validSubscription(value) {
  if (!value || typeof value.endpoint !== 'string' || value.endpoint.length > 2048) return false
  if (!value.keys || typeof value.keys.p256dh !== 'string' || typeof value.keys.auth !== 'string') return false
  if (value.keys.p256dh.length > 256 || value.keys.auth.length > 256) return false
  if (value.endpoint.length < 8 || value.keys.p256dh.length < 16 || value.keys.auth.length < 8) return false
  if (!/^[A-Za-z0-9_-]+$/.test(value.keys.p256dh) || !/^[A-Za-z0-9_-]+$/.test(value.keys.auth)) return false

  try {
    return new URL(value.endpoint).protocol === 'https:'
  } catch {
    return false
  }
}

async function register(req, res, next) {
  try {
    const subscription = req.body
    if (!validSubscription(subscription)) {
      return res.status(400).json({ success: false, message: 'A valid browser push subscription is required' })
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        $set: {
          user: req.user._id,
          keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
        },
        $setOnInsert: { endpoint: subscription.endpoint },
      },
      { upsert: true, new: true, runValidators: true },
    )
    return res.status(201).json({ success: true, message: 'This device is registered for order notifications' })
  } catch (error) {
    return next(error)
  }
}

async function unregister(req, res, next) {
  try {
    const endpoint = req.body?.endpoint
    if (typeof endpoint !== 'string' || endpoint.length > 2048) {
      return res.status(400).json({ success: false, message: 'A valid subscription endpoint is required' })
    }
    await PushSubscription.deleteOne({ user: req.user._id, endpoint })
    return res.json({ success: true, message: 'This device was removed from order notifications' })
  } catch (error) {
    return next(error)
  }
}

module.exports = { register, unregister }
