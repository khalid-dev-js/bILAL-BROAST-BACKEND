const mongoose = require('mongoose')
const { mongodbUri, mongodbFallbackUri } = require('./env')

async function tryConnect(uri, options = {}) {
  await mongoose.connect(uri, options)
}

async function connectDB() {
  const options = { dbName: 'bilal-broast' }
  try {
    await tryConnect(mongodbUri, options)
    console.log('MongoDB connected to', mongodbUri.startsWith('mongodb+srv://') ? 'Atlas (SRV)' : mongodbUri)
    return
  } catch (err) {
    console.error('MongoDB connection error (primary):', err && err.message ? err.message : err)
    // If SRV/DNS error or ECONNREFUSED and fallback is provided, try fallback
    const isSrvError = err && err.code === 'ENOTFOUND' || err && err.code === 'ECONNREFUSED' || (err && /querySrv/i.test(String(err.message || '')))
    if (mongodbFallbackUri && isSrvError) {
      try {
        console.log('Attempting fallback MongoDB URI...')
        await tryConnect(mongodbFallbackUri, { dbName: 'bilal-broast' })
        console.log('MongoDB connected to fallback URI')
        return
      } catch (err2) {
        console.error('MongoDB connection error (fallback):', err2 && err2.message ? err2.message : err2)
      }
    }
    console.error('Failed to connect to MongoDB. Exiting.')
    process.exit(1)
  }
}

module.exports = connectDB
