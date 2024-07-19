const Conversation = require('../models/conversation.model.js');
const Message = require('../models/message.model.js');
// const { getReceiverSocketId, sendMessageToUser, sendNotificationToUser } = require('../services/socket.service.js');
const SocketManager = require('../services/socket.service.js');

const manager = new SocketManager().getInstance();

const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    // await conversation.save();
    // await newMessage.save();

    // this will run in parallel
    await Promise.all([conversation.save(), newMessage.save()]);

    // SOCKET IO FUNCTIONALITY WILL GO HERE
    const receiverSocketId = manager.getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      console.log(receiverSocketId);
      // io.to(<socket_id>).emit() used to send events to specific client
      manager.sendMessageToUser({ receiverSocketId, newMessage });
      manager.sendNotificationToUser({ receiverSocketId, newMessage });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log('Error in sendMessage controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate('messages', '-_id -updatedAt -__v'); // NOT REFERENCE BUT ACTUAL MESSAGES

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.messages;

    res.status(200).json(messages);
  } catch (error) {
    console.log('Error in getMessages controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllConversationsForUser = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const conversations = await Conversation.find({ participants: loggedInUserId })
      .select('-messages')
      .populate('participants', 'name id role');

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error in getUsersForSidebar: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  sendMessage,
  getAllConversationsForUser,
  getMessages,
};
