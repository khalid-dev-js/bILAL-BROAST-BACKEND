const express = require('express')
const router = express.Router()
const requireAuth = require('../../middleware/requireAuth.middleware')
const requireAdmin = require('../../middleware/admin.middleware')
const ctrl = require('../../controllers/admin/order.controller')

router.get('/', requireAuth, requireAdmin, ctrl.listOrders)
router.post('/local', ctrl.createLocalOrder)
router.get('/local', ctrl.listLocalOrders)
router.get('/:id', requireAuth, requireAdmin, ctrl.getOrder)
router.patch('/:id/status', requireAuth, requireAdmin, ctrl.updateOrderStatus)
router.patch('/:id/payment', requireAuth, requireAdmin, ctrl.updatePaymentStatus)

module.exports = router
