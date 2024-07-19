const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const firebase = require('firebase/app');
// const socket = require('./services/chatsocket.service');
const SocketManager = require('./services/socket.service');

// sockets
const socketIo = require('./controllers/chatbot/sockets/socket.connection');

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');

  // httpserver with sockets
  server = socketIo.socketConfig(app);
  server.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});
// server = app.listen(config.port, () => {
//   logger.info(`Listening to port ${config.port}`);
// });
// socket(server);
// const socketmanager = new SocketManager(server);
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
