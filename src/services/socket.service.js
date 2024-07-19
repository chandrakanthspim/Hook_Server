// import { Server } from 'socket.io';
const socketIo = require('socket.io');
const crypto = require('node:crypto');
const {Request,Employee } = require('../models');
// import http from 'http';
// import express from 'express';
// const MessageController = require('../controllers/message.controller');
const pendingRequests = {};
class SocketManager {
  constructor(server) {
    this.http = require('http').Server(server);
    this.userSocketMap = {};
    this.io = socketIo(this.http, {
      cors: {
        origin: 'http://localhost:4000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      allowEIO3: true,
    }).listen(8080);
    this.messaging = this.io.of('/messaging');
    this.livechat = this.io.of('/livechat');
    this.initSocketEvents();
  }

  initSocketEvents() {
    this.messaging.on('connection', (socket) => {
      console.log('a user connected', socket.id);

      const userId = socket.handshake.query.userId;
      if (userId != 'undefined') this.userSocketMap[userId] = socket.id;

      socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
      });

      // io.emit() is used to send events to all the connected clients
      this.messaging.emit('getOnlineUsers', Object.keys(this.userSocketMap));
      socket.on('livechat-msg', ({ roomId, message }) => {
        console.log(message);
        // this.sendMessageToUser({ receiverSocketId, message })
        this.messaging.to(roomId).emit('livechat-msg', { handle: 'user', message });
      });
      // socket.on() is used to listen to the events. can be used both on client and server side
      socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
        delete this.userSocketMap[userId];
        this.messaging.emit('getOnlineUsers', Object.keys(this.userSocketMap));
      });
    });

    this.livechat.on('connection', (socket) => {
      console.log('user connected:', socket.id);

      const userId = socket.handshake.query.userId;
      if (userId != 'undefined') this.userSocketMap[userId] = socket.id;

      socket.on('joinProjectRoom', ({ projectId }) => {
        socket.join(`project_${projectId}`);
        console.log(`Agent ${userId} joined project ${projectId}`);
      });

      socket.on('joinRoom', async ({roomId,employeeId }) => {
        socket.join(roomId);
        console.log(`${userId} joined room: ${roomId}`);

        if (roomId === 'agents') {
          const empProjects= await Employee.find(employeeId,{assignedProjects:1})
          
          const pendingRequests = await Request({
            'projectId': { $in: empProjects}
        }).lean()
          pendingRequests.forEach((request) => {
            socket.emit('agentRequested', { userId: request.userId, roomId: request.roomId });
          });
        }
      });

      socket.on('requestAgent', async ({userId,roomId,projectId }) => {
        console.log('in request agent')
        const pendingRequest = new Request({ userId, roomId ,projectId});
        await pendingRequest.save();

        this.livechat.emit(`project_${projectId}`, { userId, roomId ,projectId});

        pendingRequests[roomId] = setTimeout(async () => {
          this.livechat.to(roomId).emit('message', 'No agents available at the moment.');
          await Request.deleteOne({ roomId });
          delete pendingRequests[roomId];
        }, 300000); // 5 minutes

        console.log(`Agent requested by ${userId} in room: ${roomId}`);
      });

      socket.on('joinAsAgent', async ({ roomId }) => {
        const pendingRequest = await Request.findOne({ roomId });
        if (pendingRequest) {
          await Request.deleteOne({ roomId });
          clearTimeout(pendingRequests[roomId]);
          delete pendingRequests[roomId];

          socket.join(roomId);
          console.log(`${userId} joined room: ${roomId}`);
          this.livechat.to(roomId).emit('agentJoined', { userId });
        } else {
          socket.emit('message', 'Request is no longer available.');
        }
      });

      socket.on('message', ({ roomId,username, message }) => {
        this.livechat.to(roomId).emit('message', {username,message});
      });

      socket.on('disconnect', () => {
        console.log('Agent disconnected:', socket.id);
      });
    });
  }

  async requestForHandOff({projectId,roomId,userId}){
    console.log('in request agent')
        const pendingRequest = new Request({ userId, roomId ,projectId});
        await pendingRequest.save();

        this.livechat.emit(`project_${projectId}`, { userId, roomId ,projectId});

        pendingRequests[roomId] = setTimeout(async () => {
          this.livechat.to(roomId).emit('message', 'No agents available at the moment.');
          await Request.deleteOne({ roomId });
          delete pendingRequests[roomId];
        }, 300000); // 5 minutes

        console.log(`Agent requested by ${userId} in room: ${roomId}`);
  }
  sendMessageToUser({ receiverSocketId, message }) {
    this.messaging.to(receiverSocketId).emit('newMessage', message);
  }

  sendNotificationToUser({ receiverSocketId, notification }) {
    this.messaging.to(receiverSocketId).emit('notification', notification);
  }

  getReceiverSocketId(receiverId) {
    // console.log('inside socket generate id');
    try {
      return this.userSocketMap[receiverId];
    } catch (err) {
      console.error(err.message);
    }
  }
  generateSessionId(user1, user2) {
    const sessionId = user1 < user2 ? `${user1}-${user2}` : `${user2}-${user1}`; // Combine user IDs
    const hash = crypto.createHash('sha256').update(sessionId).digest('base64'); // Hash the session ID and convert to base64
    // Remove non-alphanumeric characters and truncate to 12 characters
    const shortenedHash = hash.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
    return shortenedHash;
  }
}
class SocketSingleton {
  constructor(server) {
    if (!SocketSingleton.instance) {
      SocketSingleton.instance = new SocketManager(server);
    }
  }

  getInstance() {
    return SocketSingleton.instance;
  }
}
module.exports = SocketSingleton;

// function initSocket(server) {
//   const http = require('http').Server(server);
//   //   const io = socketIo(server);
//   const io = socketIo(http, {
//     cors: {
//       origin: 'http://localhost:4000',
//       methods: ['GET', 'POST'],
//       credentials: true,
//     },
//     allowEIO3: true,
//   }).listen(8080);
//   const userSocketMap = {};
//   function getReceiverSocketId(receiverId) {
//     console.log('inside socket generate id');
//     try {
//       return userSocketMap[receiverId];
//     } catch (err) {
//       console.error(err.message);
//     }
//   }
//   function generateSessionId(user1, user2) {
//     const sessionId = user1 < user2 ? `${user1}-${user2}` : `${user2}-${user1}`; // Combine user IDs
//     const hash = crypto.createHash('sha256').update(sessionId).digest('base64'); // Hash the session ID and convert to base64
//     // Remove non-alphanumeric characters and truncate to 12 characters
//     const shortenedHash = hash.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
//     return shortenedHash;
//   }

//   io.on('connection', (socket) => {
//     console.log('a user connected', socket.id);

//     const userId = socket.handshake.query.userId;
//     if (userId != 'undefined') userSocketMap[userId] = socket.id;

//     // io.emit() is used to send events to all the connected clients
//     io.emit('getOnlineUsers', Object.keys(userSocketMap));

//     // socket.on() is used to listen to the events. can be used both on client and server side
//     socket.on('disconnect', () => {
//       console.log('user disconnected', socket.id);
//       delete userSocketMap[userId];
//       io.emit('getOnlineUsers', Object.keys(userSocketMap));
//     });
//   });
//   function sendMessageToUser({ receiverSocketId, message }) {
//     io.to(receiverSocketId).emit('newMessage', message);
//   }

//   function sendNotificationToUser({ receiverSocketId, notification }) {
//     io.to(receiverSocketId).emit('notification', notification);
//   }

//   return { generateSessionId, getReceiverSocketId, sendNotificationToUser, sendMessageToUser, io };
// }
// module.exports = initSocket;

// const app = express();

// const http = require('http').Server(server);
// //   const io = socketIo(server);
// const io = socketIo(http, {
//   cors: {
//     origin: 'http://localhost:4000',
//     methods: ['GET', 'POST'],
//     credentials: true,
//   },
//   allowEIO3: true,
// }).listen(8080);

// export const getReceiverSocketId = (receiverId) => {
//   return userSocketMap[receiverId];
// };
// export const generateSessionId = (user1, user2) => {
//   const sessionId = user1 < user2 ? `${user1}-${user2}` : `${user2}-${user1}`; // Combine user IDs
//   const hash = crypto.createHash('sha256').update(sessionId).digest('base64'); // Hash the session ID and convert to base64
//   // Remove non-alphanumeric characters and truncate to 12 characters
//   const shortenedHash = hash.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
//   return shortenedHash;
// };
// const userSocketMap = {}; // {userId: socketId}

// io.on('connection', (socket) => {
//   console.log('a user connected', socket.id);

//   const userId = socket.handshake.query.userId;
//   if (userId != 'undefined') userSocketMap[userId] = socket.id;

//   // io.emit() is used to send events to all the connected clients
//   io.emit('getOnlineUsers', Object.keys(userSocketMap));

//   // socket.on() is used to listen to the events. can be used both on client and server side
//   socket.on('disconnect', () => {
//     console.log('user disconnected', socket.id);
//     delete userSocketMap[userId];
//     io.emit('getOnlineUsers', Object.keys(userSocketMap));
//   });
// });

// export { app, io, server };
