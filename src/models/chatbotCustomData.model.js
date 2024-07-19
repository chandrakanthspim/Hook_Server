const mongoose = require('mongoose');

const chatbotCustomDataSchema = new mongoose.Schema(
  {
    builderID: 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Builder',
      },
    chatbotName:{type:String},
    color1:{type:String},
    color2:{type:String},
    profileImageUrl:{type:String},
    welcomeMessage:{type:String},
    leadCaptureAt:{type:[String]}
  },
  { timestamps: true }
);

const ChatbotCustomData = mongoose.model('ChatbotCustomData', chatbotCustomDataSchema);

module.exports = ChatbotCustomData;
