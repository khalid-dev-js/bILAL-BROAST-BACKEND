const express = require('express')
const router = express.Router()
const { register, login, adminLogin, me, logout, updateProfile, changePassword } = require('../controllers/auth.controller')
const authMiddleware = require('../middleware/auth.middleware')
const requireAuth = require('../middleware/requireAuth.middleware')

router.post('/register', register)
router.post('/login', login)
router.post('/admin-login', adminLogin)
router.post('/logout', logout)
router.get('/me', authMiddleware, me)
router.patch('/profile', requireAuth, updateProfile)
router.patch('/change-password', requireAuth, changePassword)

module.exports = router
