const mongoose = require('mongoose')
const Order = require('../../models/Order')
const Product = require('../../models/Product')
const generateOrderNumber = require('../../utils/generateOrderNumber')
const { getIo } = require('../../sockets')
const { notifyAdminsOfNewOrder } = require('../../services/push-notifications')

function parseDateFilter(value, endOfDay = false) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`)
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null
    if (endOfDay) date.setUTCHours(23, 59, 59, 999)
    return date
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

async function createLocalOrder(req, res, next) {
  try {
    const { items, paymentMethod, customerName, isCallOrder = false } = req.body
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' })
    }
    if (!['cash', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'paymentMethod must be cash or online' })
    }
    if (customerName !== undefined && typeof customerName !== 'string') {
      return res.status(400).json({ success: false, message: 'customerName must be a string' })
    }
    if (typeof isCallOrder !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isCallOrder must be a boolean' })
    }
    if (items.some((item) => !item.productId || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
      return res.status(400).json({ success: false, message: 'Each item requires productId and a positive integer quantity' })
    }

    const productIds = items.map((item) => String(item.productId))
    const validIds = productIds.filter(mongoose.isValidObjectId)
    const products = await Product.find({ $or: [{ _id: { $in: validIds } }, { slug: { $in: productIds } }] })
    const orderItems = []

    for (const item of items) {
      const productId = String(item.productId)
      const product = products.find((candidate) => candidate._id.toString() === productId || candidate.slug === productId)
      if (!product) return res.status(400).json({ success: false, message: `Product ${productId} not found` })
      if (!product.isAvailable) return res.status(400).json({ success: false, message: `Product ${product.name} is not available` })
      const quantity = Number(item.quantity)
      const lineTotal = product.price * quantity
      orderItems.push({
        product: product._id,
        nameSnapshot: product.name,
        imageSnapshot: product.image,
        priceSnapshot: product.price,
        quantity,
        lineTotal,
      })
    }

    const subtotal = orderItems.reduce((total, item) => total + item.lineTotal, 0)
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      source: 'local',
      ...(customerName !== undefined ? { customerName: customerName.trim() } : {}),
      isCallOrder,
      items: orderItems,
      paymentMethod,
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      subtotal,
      deliveryFee: 0,
      discount: 0,
      grandTotal: subtotal,
    })

    const io = getIo()
    if (io) io.to('admin').emit('order:new', order)
    await notifyAdminsOfNewOrder(order)
    return res.status(201).json({ success: true, message: 'Local order created successfully', data: order })
  } catch (err) { next(err) }
}

async function listLocalOrders(req, res, next) {
  try {
    const { dateFrom, dateTo, isCallOrder } = req.query
    const query = { source: 'local' }
    if (isCallOrder !== undefined) {
      if (isCallOrder !== 'true' && isCallOrder !== 'false') {
        return res.status(400).json({ success: false, message: 'isCallOrder must be true or false' })
      }
      query.isCallOrder = isCallOrder === 'true' ? true : { $in: [false, null] }
    }
    if (dateFrom || dateTo) {
      const from = dateFrom ? parseDateFilter(dateFrom) : null
      const to = dateTo ? parseDateFilter(dateTo, /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) : null
      if ((dateFrom && !from) || (dateTo && !to) || (from && to && from > to)) {
        return res.status(400).json({ success: false, message: 'dateFrom/dateTo must be valid dates and dateFrom must not be after dateTo' })
      }
      query.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) }
    }
    const orders = await Order.find(query).sort({ createdAt: -1 })
    return res.json({ success: true, data: orders, total: orders.length })
  } catch (err) { next(err) }
}

async function listOrders(req, res, next) {
  try {
    const { page = 1, limit = 20, status, orderStatus, paymentStatus, isCallOrder, search, dateFrom, dateTo, sort = 'newest' } = req.query
    const q = {}
    if (status || orderStatus) q.orderStatus = status || orderStatus
    if (paymentStatus) q.paymentStatus = paymentStatus
    if (isCallOrder !== undefined) {
      if (isCallOrder !== 'true' && isCallOrder !== 'false') {
        return res.status(400).json({ success: false, message: 'isCallOrder must be true or false' })
      }
      q.isCallOrder = isCallOrder === 'true' ? true : { $in: [false, null] }
    }
    if (search) q.$or = [ { orderNumber: new RegExp(search, 'i') }, { customerName: new RegExp(search, 'i') }, { 'customerSnapshot.name': new RegExp(search, 'i') }, { 'customerSnapshot.email': new RegExp(search, 'i') }, { 'customerSnapshot.phone': new RegExp(search, 'i') } ]
    if (dateFrom || dateTo) q.createdAt = { ...(dateFrom ? { $gte: new Date(dateFrom) } : {}), ...(dateTo ? { $lte: new Date(dateTo) } : {}) }
    const pageNum = Number(page), lim = Number(limit)
    const total = await Order.countDocuments(q)
    const sortValue = sort === 'oldest' ? { createdAt: 1 } : sort === 'total_high' ? { grandTotal: -1 } : sort === 'total_low' ? { grandTotal: 1 } : { createdAt: -1 }
    const orders = await Order.find(q).sort(sortValue).skip((pageNum-1)*lim).limit(lim)
    res.json({ success: true, data: { orders, total, page: pageNum, limit: lim } })
  } catch (err) { next(err) }
}

async function getOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    res.json({ success: true, data: order })
  } catch (err) { next(err) }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { orderStatus } = req.body
    if (!orderStatus) return res.status(400).json({ success: false, message: 'orderStatus required' })
    const allowed = { pending: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'], preparing: ['ready'], ready: ['out_for_delivery'], out_for_delivery: [] }
    const current = await Order.findById(req.params.id)
    if (!current) return res.status(404).json({ success: false, message: 'Order not found' })
    const canMarkDelivered = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(current.orderStatus) && orderStatus === 'delivered'
    if (current.orderStatus !== orderStatus && !canMarkDelivered && !(allowed[current.orderStatus] || []).includes(orderStatus)) return res.status(422).json({ success: false, message: `Invalid status transition from ${current.orderStatus} to ${orderStatus}` })
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus }, { new: true })
    // emit socket events
    try {
      const io = getIo()
      if (io) {
        io.to('admin').emit('order:status-updated', order)
        const userId = order.customerSnapshot && order.customerSnapshot.userId
        if (userId) io.to(`customer:${userId}`).emit('order:status-updated', order)
      }
    } catch (e) { /* ignore socket errors */ }
    res.json({ success: true, data: order })
  } catch (err) { next(err) }
}

async function updatePaymentStatus(req, res, next) {
  try {
    const { paymentStatus } = req.body
    if (!paymentStatus) return res.status(400).json({ success: false, message: 'paymentStatus required' })
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus }, { new: true })
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    try {
      const io = getIo()
      if (io) {
        io.to('admin').emit('order:payment-updated', order)
        const userId = order.customerSnapshot && order.customerSnapshot.userId
        if (userId) io.to(`customer:${userId}`).emit('order:payment-updated', order)
      }
    } catch (e) {}
    res.json({ success: true, data: order })
  } catch (err) { next(err) }
}

module.exports = { createLocalOrder, listLocalOrders, listOrders, getOrder, updateOrderStatus, updatePaymentStatus }
