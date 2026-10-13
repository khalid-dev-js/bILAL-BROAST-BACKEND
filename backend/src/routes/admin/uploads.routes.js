const express = require('express')
const router = express.Router()
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, callback) => {
		const allowed = ['image/jpeg', 'image/png', 'image/webp']
		callback(null, allowed.includes(file.mimetype))
	},
})
const requireAuth = require('../../middleware/requireAuth.middleware')
const requireAdmin = require('../../middleware/admin.middleware')
const ctrl = require('../../controllers/admin/upload.controller')

router.post('/image', requireAuth, requireAdmin, upload.single('file'), ctrl.uploadImage)
router.delete('/image', requireAuth, requireAdmin, ctrl.deleteImage)

module.exports = router
