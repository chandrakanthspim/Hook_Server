// controllers/MessageController.js
const Message = require('../models/message.model');
const firebase = require('firebase/app');
require('firebase/database');
require('firebase/storage');

class MessageController {
  static async sendMessage(sender, receiver, message, imageFile, roomId, io) {
    try {
      let imageUrl = null;
      if (imageFile) {
        // Save image to Firebase Storage
        const storageRef = firebase.storage().ref();
        const imageRef = storageRef.child('images/' + roomId + '/' + Date.now() + '_' + sender);
        await imageRef.put(imageFile);

        // Get the download URL of the uploaded image
        imageUrl = await imageRef.getDownloadURL();
      }

      // Save message (including image URL) to Firebase Realtime Database
      // const messageRef = firebase.database().ref('messages').child(roomId).push();
      // const newMessage = new Message(sender, receiver, message, imageUrl);
      // await messageRef.set(newMessage);

      // Broadcast the message to all users in the room
      io.to(roomId).emit('sendMsg', {
        sender: sender,
        message: message,
        imageUrl: imageUrl,
        timestamp: Date.now().toString(),
      });
      console.log('Message sent and saved to database successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}

module.exports = MessageController;
