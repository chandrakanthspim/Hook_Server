// modules/socket.js
const socketIo = require('socket.io');
const MessageController = require('../controllers/message.controller');
// const server = http.createServer(app);

module.exports = function (server) {
  // Initialize Socket.IO
  const http = require('http').Server(server);
  //   const io = socketIo(server);
  const io = socketIo(http, {
    cors: {
      origin: 'http://localhost:4000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    allowEIO3: true,
  }).listen(8080);

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle joining DM room and retrieving previous messages
    socket.on('joinRoom', (roomId) => {
      console.log(`User ${socket.id} joining room ${roomId}`);
      socket.join(roomId);
      // Handle retrieving previous messages...
    });

    // Handle message sending
    socket.on('sendMessage', async (data) => {
      const { sender, receiver, message, imageFile, roomId } = data;
      await MessageController.sendMessage(sender, receiver, message, imageFile, roomId, io);
    });

    //Error handling
    socket.on('connect_error', (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    // Handle disconnections
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
