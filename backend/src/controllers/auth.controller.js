const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { jwtSecret, jwtExpiresIn, nodeEnv } = require('../config/env')

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn })
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
}

async function register(req, res, next) {
  try {
    const { name, email, phone, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Missing fields' })
    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' })
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, phone, passwordHash, role: 'customer' })
    const token = signToken(user)
    setAuthCookie(res, token)
    res.status(201).json({ success: true, data: publicUser(user) })
  } catch (err) { next(err) }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' })
    const token = signToken(user)
    setAuthCookie(res, token)
    res.json({ success: true, data: publicUser(user) })
  } catch (err) { next(err) }
}

async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email, role: 'admin', isActive: true })
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' })
    }
    setAuthCookie(res, signToken(user))
    res.json({ success: true, data: publicUser(user) })
  } catch (err) { next(err) }
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body
    if (!name || !String(name).trim()) return res.status(422).json({ success: false, message: 'Name is required' })
    const user = await User.findByIdAndUpdate(req.user._id, { name: String(name).trim(), phone }, { new: true }).select('-passwordHash')
    res.json({ success: true, data: publicUser(user) })
  } catch (err) { next(err) }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword || String(newPassword).length < 8) {
      return res.status(422).json({ success: false, message: 'Current password and a new password of at least 8 characters are required' })
    }
    const user = await User.findById(req.user._id)
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(401).json({ success: false, message: 'Current password is incorrect' })
    user.passwordHash = await bcrypt.hash(newPassword, 10)
    await user.save()
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (err) { next(err) }
}

async function me(req, res) {
  const user = req.user
  if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' })
  res.json({ success: true, data: publicUser(user) })
}

function logout(req, res) {
  res.clearCookie('token', { httpOnly: true, secure: nodeEnv === 'production', sameSite: nodeEnv === 'production' ? 'none' : 'lax', path: '/' })
  res.json({ success: true, message: 'Logged out' })
}

module.exports = { register, login, adminLogin, me, logout, updateProfile, changePassword }
