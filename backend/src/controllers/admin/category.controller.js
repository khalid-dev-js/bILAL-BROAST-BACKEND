const Category = require('../../models/Category')
const Product = require('../../models/Product')

async function createCategory(req, res, next) {
  try {
    const data = req.body
    data.slug = data.slug || (data.name || '').toLowerCase().replace(/\s+/g, '-')
    const category = await Category.create(data)
    res.status(201).json({ success: true, data: category })
  } catch (err) { next(err) }
}

async function listCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 })
    res.json({ success: true, data: categories })
  } catch (err) { next(err) }
}

async function getCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: category })
  } catch (err) { next(err) }
}

async function updateCategory(req, res, next) {
  try {
    const updates = req.body
    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!category) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: category })
  } catch (err) { next(err) }
}

async function deleteCategory(req, res, next) {
  try {
    const products = await Product.find({ category: req.params.id }).limit(1)
    if (products.length) return res.status(400).json({ success: false, message: 'Category has products; deactivate instead' })
    await Category.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Category deleted' })
  } catch (err) { next(err) }
}

module.exports = { createCategory, listCategories, getCategory, updateCategory, deleteCategory }
