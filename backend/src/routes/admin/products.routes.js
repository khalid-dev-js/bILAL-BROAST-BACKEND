const express = require('express')
const router = express.Router()
const requireAuth = require('../../middleware/requireAuth.middleware')
const requireAdmin = require('../../middleware/admin.middleware')
const ctrl = require('../../controllers/admin/product.controller')

router.post('/', requireAuth, requireAdmin, ctrl.createProduct)
router.get('/', requireAuth, requireAdmin, ctrl.listAdminProducts)
router.get('/:id', requireAuth, requireAdmin, ctrl.getAdminProduct)
router.patch('/:id', requireAuth, requireAdmin, ctrl.updateAdminProduct)
router.delete('/:id', requireAuth, requireAdmin, ctrl.deleteAdminProduct)
router.patch('/:id/availability', requireAuth, requireAdmin, ctrl.setAvailability)
router.patch('/:id/featured', requireAuth, requireAdmin, ctrl.setFeatured)

module.exports = router
