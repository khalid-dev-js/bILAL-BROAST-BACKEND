const mongoose = require('mongoose')
const Order = require('../models/Order')
const Product = require('../models/Product')
const Cart = require('../models/Cart')
const generateOrderNumber = require('../utils/generateOrderNumber')
const { getIo } = require('../sockets')
const { notifyAdminsOfNewOrder } = require('../services/push-notifications')

function calculateDeliveryFee(subtotal) {
  return subtotal >= 1500 ? 0 : 150
}

async function createOrder(req, res, next) {
  let session
  try {
    const { items, deliveryAddress, paymentMethod, email } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' })
    }
    if (!deliveryAddress || typeof deliveryAddress !== 'object' || Array.isArray(deliveryAddress)) {
      return res.status(400).json({ success: false, message: 'Delivery details are required' })
    }

    const fullName = typeof deliveryAddress.fullName === 'string' ? deliveryAddress.fullName.trim() : ''
    const phone = typeof deliveryAddress.phone === 'string' ? deliveryAddress.phone.trim() : ''
    const address = typeof deliveryAddress.address === 'string' ? deliveryAddress.address.trim() : ''
    if (!fullName || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Customer name, phone number, and delivery address are required' })
    }
    if (!['cod', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'A valid payment method is required' })
    }
    if (items.some((item) => !item?.productId || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
      return res.status(400).json({ success: false, message: 'Each item requires productId and a positive integer quantity' })
    }

    session = await mongoose.startSession()
    session.startTransaction()
    const userId = req.user?._id

    // Fetch products and validate
    const productIds = items.map((item) => String(item.productId))
    const products = await Product.find({ $or: [{ _id: { $in: productIds.filter(mongoose.isValidObjectId) } }, { slug: { $in: productIds } }] }).session(session)

    const orderItems = []
    for (const it of items) {
      const pid = String(it.productId)
      let product = null
      if (mongoose.isValidObjectId(pid)) product = products.find((p) => p._id.toString() === pid)
      if (!product) product = products.find((p) => p.slug === pid)
      if (!product) {
        await session.abortTransaction()
        return res.status(400).json({ success: false, message: `Product ${pid} not found` })
      }
      if (!product.isAvailable) {
        await session.abortTransaction()
        return res.status(400).json({ success: false, message: `Product ${product.name} not available` })
      }
      const qty = Number(it.quantity)
      const lineTotal = product.price * qty
      orderItems.push({ product: product._id, nameSnapshot: product.name, imageSnapshot: product.image, priceSnapshot: product.price, quantity: qty, lineTotal })
    }

    const subtotal = orderItems.reduce((s, i) => s + i.lineTotal, 0)
    const deliveryFee = calculateDeliveryFee(subtotal)
    const discount = 0
    const grandTotal = subtotal + deliveryFee - discount

    const orderNumber = generateOrderNumber()
    const order = await Order.create([{
      orderNumber,
      ...(userId ? { customer: userId } : {}),
      customerSnapshot: {
        ...(userId ? { userId } : {}),
        name: fullName,
        email: typeof email === 'string' && email.trim() ? email.trim() : req.user?.email,
        phone,
      },
      customerName: fullName,
      items: orderItems,
      deliveryAddress: { ...deliveryAddress, fullName, phone, address },
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      subtotal,
      deliveryFee,
      discount,
      grandTotal,
    }], { session })

    if (userId) {
      await Cart.findOneAndUpdate({ user: userId }, { items: [], subtotal: 0 }, { session })
    }

    await session.commitTransaction()

    const created = order[0]
    // Emit socket events
    const io = getIo()
    if (io) {
      io.to('admin').emit('order:new', created)
      if (userId) io.to(`customer:${userId}`).emit('order:new', created)
    }
    await notifyAdminsOfNewOrder(created)

    return res.status(201).json({ success: true, message: 'Order created successfully', data: created })
  } catch (err) {
    if (session?.inTransaction()) await session.abortTransaction()
    next(err)
  } finally {
    if (session) session.endSession()
  }
}

async function getMyOrders(req, res, next) {
  try {
    const userId = req.user._id
    const orders = await Order.find({ customer: userId }).sort({ createdAt: -1 })
    res.json({ success: true, data: orders })
  } catch (err) { next(err) }
}

async function getOrderById(req, res, next) {
  try {
    const userId = req.user._id
    const { id } = req.params
    const order = await Order.findById(id)
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    if (order.customer.toString() !== userId.toString()) return res.status(403).json({ success: false, message: 'Forbidden' })
    res.json({ success: true, data: order })
  } catch (err) { next(err) }
}

async function cancelOrder(req, res, next) {
  try {
    const userId = req.user._id
    const { id } = req.params
    const order = await Order.findById(id)
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    if (order.customer.toString() !== userId.toString()) return res.status(403).json({ success: false, message: 'Forbidden' })
    if (['pending','confirmed'].includes(order.orderStatus)) {
      order.orderStatus = 'cancelled'
      await order.save()
      const io = getIo()
      if (io) io.to('admin').emit('order:cancelled', order)
      return res.json({ success: true, data: order })
    }
    return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' })
  } catch (err) { next(err) }
}

async function reorder(req, res, next) {
  try {
    const userId = req.user._id
    const { id } = req.params
    const orig = await Order.findById(id)
    if (!orig) return res.status(404).json({ success: false, message: 'Order not found' })
    if (orig.customer.toString() !== userId.toString()) return res.status(403).json({ success: false, message: 'Forbidden' })
    // create new order based on original items
    const items = orig.items.map((i) => ({ productId: i.product.toString(), quantity: i.quantity }))
    req.body = { items, deliveryAddress: orig.deliveryAddress, paymentMethod: orig.paymentMethod }
    return createOrder(req, res, next)
  } catch (err) { next(err) }
}

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder, reorder }
