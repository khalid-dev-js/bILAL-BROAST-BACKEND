const express = require('express')
const router = express.Router()
const requireAuth = require('../../middleware/requireAuth.middleware')
const requireAdmin = require('../../middleware/admin.middleware')
const ctrl = require('../../controllers/admin/dashboard.controller')

router.get('/stats', requireAuth, requireAdmin, ctrl.stats)
router.get('/recent-orders', requireAuth, requireAdmin, ctrl.recentOrders)
router.get('/top-products', requireAuth, requireAdmin, ctrl.topProducts)
router.get('/revenue', requireAuth, requireAdmin, ctrl.revenue)
router.get('/order-breakdown', requireAuth, requireAdmin, ctrl.orderBreakdown)
router.get('/live-orders', requireAuth, requireAdmin, ctrl.liveOrders)

module.exports = router
