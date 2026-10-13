const express = require('express')
const { listCategories, getCategoryBySlug } = require('../controllers/category.controller')
const router = express.Router()

router.get('/', listCategories)
router.get('/:slug', getCategoryBySlug)

module.exports = router