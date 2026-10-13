const express = require('express')
const router = express.Router()
const { getCart, addItem, updateItem, removeItem, clearCart, syncCart } = require('../controllers/cart.controller')
const requireAuth = require('../middleware/requireAuth.middleware')

router.get('/', requireAuth, getCart)
router.post('/items', requireAuth, addItem)
router.patch('/items/:productId', requireAuth, updateItem)
router.delete('/items/:productId', requireAuth, removeItem)
router.delete('/', requireAuth, clearCart)
router.post('/sync', requireAuth, syncCart)

module.exports = router
