const express = require('express')
const router = express.Router()
const requireAuth = require('../../middleware/requireAuth.middleware')
const requireAdmin = require('../../middleware/admin.middleware')
const ctrl = require('../../controllers/admin/category.controller')

router.post('/', requireAuth, requireAdmin, ctrl.createCategory)
router.get('/', requireAuth, requireAdmin, ctrl.listCategories)
router.get('/:id', requireAuth, requireAdmin, ctrl.getCategory)
router.patch('/:id', requireAuth, requireAdmin, ctrl.updateCategory)
router.delete('/:id', requireAuth, requireAdmin, ctrl.deleteCategory)

module.exports = router
