const express = require('express')
const router = express.Router()
const requireAuth = require('../../middleware/requireAuth.middleware')
const requireAdmin = require('../../middleware/admin.middleware')
const ctrl = require('../../controllers/admin/push.controller')

router.post('/', requireAuth, requireAdmin, ctrl.register)
router.delete('/', requireAuth, requireAdmin, ctrl.unregister)

module.exports = router
