const Product = require('../models/Product')
const Category = require('../models/Category')

async function getProducts(req, res, next) {
  try {
    const { page = 1, limit = 12, category, search, minPrice, maxPrice, sort, isDeal, isFeatured, isAvailable } = req.query
    const q = {}
    if (category) {
      // allow category name or id
      const cat = await Category.findOne({ $or: [{ name: category }, { slug: category }, { _id: category }] })
      if (cat) q.category = cat._id
    }
    if (search) q.$text = { $search: search }
    if (minPrice || maxPrice) q.price = { ...(minPrice ? { $gte: Number(minPrice) } : {}), ...(maxPrice ? { $lte: Number(maxPrice) } : {}) }
    if (isDeal !== undefined && isDeal !== '') q.isDeal = isDeal === 'true'
    if (isFeatured !== undefined && isFeatured !== '') q.isFeatured = isFeatured === 'true'
    if (isAvailable !== undefined && isAvailable !== '') q.isAvailable = isAvailable === 'true'

    let query = Product.find(q).populate('category')

    // sorting
    if (sort === 'price_asc') query = query.sort({ price: 1 })
    else if (sort === 'price_desc') query = query.sort({ price: -1 })
    else if (sort === 'popularity') query = query.sort({ isPopular: -1, totalReviews: -1, rating: -1 })
    else query = query.sort({ createdAt: -1 })

    const pageNum = Number(page)
    const lim = Number(limit)
    const total = await Product.countDocuments(q)
    const products = await query.skip((pageNum - 1) * lim).limit(lim)
    res.json({ success: true, data: { products, total, page: pageNum, limit: lim } })
  } catch (err) { next(err) }
}

async function getProductBySlug(req, res, next) {
  try {
    const { slug } = req.params
    const product = await Product.findOne({ slug }).populate('category')
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
    res.json({ success: true, data: product })
  } catch (err) { next(err) }
}

module.exports = { getProducts, getProductBySlug }
