let ioInstance = null

function initSocket(server) {
  const { Server } = require('socket.io')
  const { clientUrl } = require('../config/env')
  const allowedOrigins = [clientUrl, 'https://bilal-broast.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3000']
  const io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
    transports: ['polling', 'websocket'],
  })
  io.on('connection', (socket) => {
    // simple join rooms
    socket.on('admin:join', () => socket.join('admin'))
    socket.on('customer:join', (data) => {
      if (data && data.userId) socket.join(`customer:${data.userId}`)
    })
  })
  ioInstance = io
  return io
}

function getIo() {
  return ioInstance
}

module.exports = { initSocket, getIo }
