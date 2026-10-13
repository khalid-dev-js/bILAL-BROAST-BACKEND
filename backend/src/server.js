// Force public DNS servers to avoid local DNS/SRV lookup issues (helps Atlas SRV lookups)
const dns = require('dns')
try {
  dns.setServers(['8.8.8.8', '8.8.4.4'])
  console.log('Overrode DNS servers to 8.8.8.8,8.8.4.4')
} catch (e) {
  console.warn('Could not override DNS servers:', e && e.message)
}

const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')
const { port } = require('./config/env')

async function start() {
  await connectDB()
  const server = http.createServer(app)
  const { initSocket } = require('./sockets')
  const io = initSocket(server)
  // attach io to app for controllers to use if needed
  app.set('io', io)

  server.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
