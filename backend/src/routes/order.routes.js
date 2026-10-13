const express = require('express')
const router = express.Router()
const requireAuth = require('../middleware/requireAuth.middleware')
const { createOrder, getMyOrders, getOrderById, cancelOrder, reorder } = require('../controllers/order.controller')

router.post('/', createOrder)
router.get('/my', requireAuth, getMyOrders)
router.get('/:id', requireAuth, getOrderById)
router.patch('/:id/cancel', requireAuth, cancelOrder)
router.post('/:id/reorder', requireAuth, reorder)

module.exports = router
