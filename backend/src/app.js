const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const { clientUrl, nodeEnv } = require('./config/env')
const productRoutes = require('./routes/product.routes')
const categoryRoutes = require('./routes/category.routes')
const authRoutes = require('./routes/auth.routes')
const cartRoutes = require('./routes/cart.routes')
const orderRoutes = require('./routes/order.routes')
const customerRoutes = require('./routes/customer.routes')
const adminProductRoutes = require('./routes/admin/products.routes')
const adminCategoryRoutes = require('./routes/admin/categories.routes')
const adminDashboardRoutes = require('./routes/admin/dashboard.routes')
const adminUploadRoutes = require('./routes/admin/uploads.routes')
const adminOrdersRoutes = require('./routes/admin/orders.routes')
const adminPushRoutes = require('./routes/admin/push.routes')
const errorHandler = require('./middleware/error.middleware')
const authMiddleware = require('./middleware/auth.middleware')
const { retryFailedNotifications } = require('./services/push-notifications')
const { pushRetrySecret } = require('./config/env')
const mongoose = require('mongoose')

const app = express()

let databaseConnectionPromise
async function ensureDatabaseConnection() {
	if (mongoose.connection.readyState === 1) return
	if (!databaseConnectionPromise) {
		const { mongodbUri } = require('./config/env')
		databaseConnectionPromise = mongoose.connect(mongodbUri, { dbName: 'bilal-broast' }).catch((error) => {
			databaseConnectionPromise = undefined
			throw error
		})
	}
	await databaseConnectionPromise
}

app.use(async (req, res, next) => {
	try { await ensureDatabaseConnection(); next() } catch (error) { next(error) }
})

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(authMiddleware)

const allowedOrigins = new Set([clientUrl, 'https://bilal-broast.vercel.app', 'https://bilal-broast-pied.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3000'])
app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.has(origin)) return callback(null, true); return callback(new Error('Origin not allowed by CORS')) }, credentials: true }))

app.get('/api/health', (req, res) => res.json({ success: true, message: 'OK' }))

app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/admin/products', adminProductRoutes)
app.use('/api/admin/categories', adminCategoryRoutes)
app.use('/api/admin/dashboard', adminDashboardRoutes)
app.use('/api/admin/uploads', adminUploadRoutes)
app.use('/api/admin/orders', adminOrdersRoutes)
app.use('/api/admin/push-subscriptions', adminPushRoutes)
app.get('/api/internal/push-retries', async (req, res, next) => {
  try {
    if (!pushRetrySecret || req.get('authorization') !== `Bearer ${pushRetrySecret}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    const retried = await retryFailedNotifications()
    return res.json({ success: true, data: { retried } })
  } catch (error) {
    return next(error)
  }
})

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }))

app.use(errorHandler)

module.exports = app
