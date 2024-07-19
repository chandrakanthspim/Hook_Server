const mongoose = require('mongoose');

const dynamicMessagesSchema = new mongoose.Schema(
  {
    // _id: {
    //   type: mongoose.Schema.Types.ObjectId,
    // },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Builder',
      require: true,
    },
    botId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'clientChatBots',
      require: true,
    },
    message: {
      type: String,
      require: true,
    },
    // 1-> wish,  2-> others
    messageType: {
      type: Number,
      require: true,
    },
    status: {
      type: Number,
      require: true,
    },
    // createdAt: {
    //   type: Date,
    // },
    // updatedAt: {
    //   type: Date,
    // }
  },
  { timestamps: true }
);

const DynamicMessages = mongoose.model('DynamicMessages', dynamicMessagesSchema);

module.exports = {
  DynamicMessages,
};
