const mongoose = require('mongoose')
const Cart = require('../models/Cart')
const Product = require('../models/Product')

async function recalcSubtotal(cart) {
  cart.subtotal = cart.items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0)
}

async function getCart(req, res, next) {
  try {
    const userId = req.user._id
    let cart = await Cart.findOne({ user: userId }).populate('items.product')
    if (!cart) cart = { items: [], subtotal: 0 }
    res.json({ success: true, data: cart })
  } catch (err) { next(err) }
}

async function addItem(req, res, next) {
  try {
    const userId = req.user._id
    const { productId, quantity = 1 } = req.body
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' })
    const idQuery = mongoose.isValidObjectId(productId) ? { _id: productId } : { slug: productId }
    const product = await Product.findOne(idQuery)
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
    if (!product.isAvailable) return res.status(400).json({ success: false, message: 'Product not available' })
    const qty = Math.max(1, Number(quantity))

    let cart = await Cart.findOne({ user: userId })
    if (!cart) cart = new Cart({ user: userId, items: [] })

    const existing = cart.items.find((i) => i.product.toString() === product._id.toString())
    if (existing) {
      existing.quantity = Math.max(1, existing.quantity + qty)
    } else {
      cart.items.push({ product: product._id, nameSnapshot: product.name, imageSnapshot: product.image, priceSnapshot: product.price, quantity: qty })
    }
    await recalcSubtotal(cart)
    await cart.save()
    res.json({ success: true, data: cart })
  } catch (err) { next(err) }
}

async function updateItem(req, res, next) {
  try {
    const userId = req.user._id
    const { productId } = req.params
    const { quantity } = req.body
    const qty = Math.max(1, Number(quantity))
    const cart = await Cart.findOne({ user: userId })
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' })
    let productObjectId = productId
    if (!mongoose.isValidObjectId(productId)) {
      const product = await Product.findOne({ slug: productId }).select('_id')
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
      productObjectId = product._id.toString()
    }
    const item = cart.items.find((i) => i.product.toString() === productObjectId)
    if (!item) return res.status(404).json({ success: false, message: 'Item not in cart' })
    item.quantity = qty
    await recalcSubtotal(cart)
    await cart.save()
    res.json({ success: true, data: cart })
  } catch (err) { next(err) }
}

async function removeItem(req, res, next) {
  try {
    const userId = req.user._id
    const { productId } = req.params
    const cart = await Cart.findOne({ user: userId })
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' })
    let productObjectId = productId
    if (!mongoose.isValidObjectId(productId)) {
      const product = await Product.findOne({ slug: productId }).select('_id')
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
      productObjectId = product._id.toString()
    }
    cart.items = cart.items.filter((i) => i.product.toString() !== productObjectId)
    await recalcSubtotal(cart)
    await cart.save()
    res.json({ success: true, data: cart })
  } catch (err) { next(err) }
}

async function clearCart(req, res, next) {
  try {
    const userId = req.user._id
    const cart = await Cart.findOne({ user: userId })
    if (cart) {
      cart.items = []
      cart.subtotal = 0
      await cart.save()
    }
    res.json({ success: true, data: { items: [], subtotal: 0 } })
  } catch (err) { next(err) }
}

async function syncCart(req, res, next) {
  try {
    const userId = req.user._id
    const { items = [] } = req.body // items: [{ productId, quantity }]
    if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'Invalid items' })
    let cart = await Cart.findOne({ user: userId })
    if (!cart) cart = new Cart({ user: userId, items: [] })
    for (const it of items) {
      const pid = it.productId
      if (!pid) continue
      const idQuery = mongoose.isValidObjectId(pid) ? { _id: pid } : { slug: pid }
      const product = await Product.findOne(idQuery)
      if (!product) continue
      const qty = Math.max(1, Number(it.quantity) || 1)
      const existing = cart.items.find((i) => i.product.toString() === product._id.toString())
      if (existing) existing.quantity = Math.max(existing.quantity, qty)
      else cart.items.push({ product: product._id, nameSnapshot: product.name, imageSnapshot: product.image, priceSnapshot: product.price, quantity: qty })
    }
    await recalcSubtotal(cart)
    await cart.save()
    res.json({ success: true, data: cart })
  } catch (err) { next(err) }
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, syncCart }
