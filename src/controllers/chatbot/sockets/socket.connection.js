// import { Server } from 'socket.io';
// import { createServer } from 'http';

const socketIo = require('socket.io');
const http = require('http');
const { sendWelcomeMessages, getNextMessages } = require('../communication/bot_communication');

/**
 *
 * @param {*} app
 */
const socketConfig = (app) => {
  const httpServer = http.createServer(app);

  const io = new socketIo.Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', async (socket) => {
    console.log('connection starts', socket.id, socket.handshake.query);
    // a new user popped up to builder site
    // new connection established
    const botId = '667c6b86b784fa2b24d6c3b0';
    await sendWelcomeMessages(socket, botId, 'welcome');

    // next messages
    socket.on('sharemessage', (message) => {
      console.log('message received:', message, '\tsocket id', socket.id);
      getNextMessages(socket, 'sharemessage', message);
    });

    console.log('socket rooms:', socket.rooms);
  });

  return httpServer;
};

module.exports = { socketConfig };

// app.get("/hello",(req,res)=>{
//   console.log("Text", Array.from(connections.keys()));
//   io.to("hellogroup").emit("sharemessage", { success: true});
//   console.log("socket rooms:");
//   res.send("<h1>Hello</h1>")
// })
