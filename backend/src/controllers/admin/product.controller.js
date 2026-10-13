const Product = require('../../models/Product')
const Category = require('../../models/Category')

async function createProduct(req, res, next) {
  try {
    const data = req.body
    // ensure category exists or create by name
    if (data.category && typeof data.category === 'string') {
      let cat = await Category.findOne({ $or: [{ _id: data.category }, { name: data.category }, { slug: data.category }] })
      if (!cat) cat = await Category.create({ name: data.category, slug: data.category.toLowerCase().replace(/\s+/g, '-') })
      data.category = cat._id
    }
    const product = await Product.create(data)
    res.status(201).json({ success: true, data: product })
  } catch (err) { next(err) }
}

async function listAdminProducts(req, res, next) {
  try {
    const { page = 1, limit = 20, search } = req.query
    const q = {}
    if (search) q.$or = [{ name: new RegExp(search, 'i') }, { slug: new RegExp(search, 'i') }]
    const pageNum = Number(page), lim = Number(limit)
    const total = await Product.countDocuments(q)
    const products = await Product.find(q).populate('category').skip((pageNum - 1) * lim).limit(lim).sort({ createdAt: -1 })
    res.json({ success: true, data: { products, total, page: pageNum, limit: lim } })
  } catch (err) { next(err) }
}

async function getAdminProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).populate('category')
    if (!product) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: product })
  } catch (err) { next(err) }
}

async function updateAdminProduct(req, res, next) {
  try {
    const updates = req.body
    if (updates.category && typeof updates.category === 'string') {
      let cat = await Category.findOne({ $or: [{ _id: updates.category }, { name: updates.category }, { slug: updates.category }] })
      if (!cat) cat = await Category.create({ name: updates.category, slug: updates.category.toLowerCase().replace(/\s+/g, '-') })
      updates.category = cat._id
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('category')
    if (!product) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: product })
  } catch (err) { next(err) }
}

async function deleteAdminProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, message: 'Product deleted' })
  } catch (err) { next(err) }
}

async function setAvailability(req, res, next) {
  try {
    const { available } = req.body
    const product = await Product.findByIdAndUpdate(req.params.id, { isAvailable: !!available }, { new: true })
    if (!product) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: product })
  } catch (err) { next(err) }
}

async function setFeatured(req, res, next) {
  try {
    const { featured } = req.body
    const product = await Product.findByIdAndUpdate(req.params.id, { isFeatured: !!featured }, { new: true })
    if (!product) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: product })
  } catch (err) { next(err) }
}

module.exports = { createProduct, listAdminProducts, getAdminProduct, updateAdminProduct, deleteAdminProduct, setAvailability, setFeatured }
