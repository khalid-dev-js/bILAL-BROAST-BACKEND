const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { jwtSecret } = require('../config/env')

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token
    if (!token) return next()
    const payload = jwt.verify(token, jwtSecret)
    const user = await User.findById(payload.id).select('-passwordHash')
    if (user) req.user = user
    next()
  } catch (err) { next() }
}

module.exports = authMiddleware
