const mongoose = require('mongoose');

const chatBotsSchema = new mongoose.Schema(
  {
    // _id: {
    //   type: mongoose.Schema.Types.ObjectId,
    // },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Builder',
      require: true,
    },
    name: {
      type: mongoose.Schema.Types.String,
    },
    status: {
      type: mongoose.Schema.Types.Number,
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

const ClientChatBots = mongoose.model('ClientChatBots', chatBotsSchema);

module.exports = {
  ClientChatBots,
};
