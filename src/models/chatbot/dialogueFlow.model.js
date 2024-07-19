const mongoose = require('mongoose');

const dialogFlowSchema = new mongoose.Schema(
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
    attributeCode: {
      type: String,
      require: true,
    },
    level: {
      type: Number,
      require: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'dynamicMessages',
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
    // },
  },
  { timestamps: true }
);

const DialogueFlows = mongoose.model('ChatbotDialogueFlows', dialogFlowSchema);

module.exports = {
  DialogueFlows,
};
