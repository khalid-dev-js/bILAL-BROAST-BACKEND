const Category = require('../models/Category')

async function listCategories(req, res, next) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 })
    res.json({ success: true, data: categories })
  } catch (err) { next(err) }
}

async function getCategoryBySlug(req, res, next) {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' })
    res.json({ success: true, data: category })
  } catch (err) { next(err) }
}

module.exports = { listCategories, getCategoryBySlug }