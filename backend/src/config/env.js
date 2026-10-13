const path = require('path')
const dotenv = require('dotenv')

const envPath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
dotenv.config({ path: path.resolve(process.cwd(), envPath) })

module.exports = {
  port: process.env.PORT || 4000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bilal-broast',
  // If not provided, default to local MongoDB so the app can start during development
  mongodbFallbackUri: process.env.MONGODB_FALLBACK_URI || process.env.MONGODB_FALLBACK || 'mongodb://127.0.0.1:27017/bilal-broast',
  jwtSecret: process.env.JWT_SECRET || 'change_this',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || '',
  pushRetrySecret: process.env.PUSH_RETRY_SECRET || '',
}
