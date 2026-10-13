const Order = require('../../models/Order')
const Product = require('../../models/Product')
const User = require('../../models/User')

async function stats(req, res, next) {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)

    const todayOrders = await Order.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } })
    const todayRevenueAgg = await Order.aggregate([{ $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } }, { $group: { _id: null, revenue: { $sum: '$grandTotal' } } }])
    const todayRevenue = (todayRevenueAgg[0] && todayRevenueAgg[0].revenue) || 0
    const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['pending','confirmed','preparing'] } })
    const totalCustomers = await User.countDocuments({ role: 'customer' })
    const totalProducts = await Product.countDocuments()
    const avgOrderAgg = await Order.aggregate([{ $group: { _id: null, avg: { $avg: '$grandTotal' } } }])
    const averageOrderValue = (avgOrderAgg[0] && avgOrderAgg[0].avg) || 0

    res.json({ success: true, data: { todayOrders, todayRevenue, pendingOrders, totalCustomers, totalProducts, averageOrderValue } })
  } catch (err) { next(err) }
}

async function recentOrders(req, res, next) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(10)
    res.json({ success: true, data: orders })
  } catch (err) { next(err) }
}

async function topProducts(req, res, next) {
  try {
    const agg = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.nameSnapshot', count: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
    res.json({ success: true, data: agg })
  } catch (err) { next(err) }
}

async function revenue(req, res, next) {
  try {
    const period = req.query.period || 'today'
    const start = new Date()
    if (period === 'week') start.setDate(start.getDate() - 7)
    else if (period === 'month') start.setMonth(start.getMonth() - 1)
    else if (period === 'year') start.setFullYear(start.getFullYear() - 1)
    else start.setHours(0, 0, 0, 0)
    const data = await Order.aggregate([{ $match: { createdAt: { $gte: start }, orderStatus: { $ne: 'cancelled' } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }, { $sort: { _id: 1 } }])
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

async function orderBreakdown(req, res, next) {
  try {
    const data = await Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }])
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']
    res.json({ success: true, data: Object.fromEntries(statuses.map((status) => [status, data.find((item) => item._id === status)?.count || 0])) })
  } catch (err) { next(err) }
}

async function liveOrders(req, res, next) {
  try {
    const orders = await Order.find({ orderStatus: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] } }).sort({ createdAt: -1 })
    res.json({ success: true, data: orders })
  } catch (err) { next(err) }
}

module.exports = { stats, recentOrders, topProducts, revenue, orderBreakdown, liveOrders }
