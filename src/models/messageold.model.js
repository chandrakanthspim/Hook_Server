// models/Message.js
const firebase = require('firebase/app');
require('firebase/database');

class Message {
  constructor(sender, receiver, message, imageUrl) {
    this.sender = sender;
    this.receiver = receiver;
    this.message = message;
    this.imageUrl = imageUrl;
    this.timestamp = firebase.database.ServerValue.TIMESTAMP;
  }
}

module.exports = Message;
