const { Schema, model } = require('mongoose');

const chatbotSessionSchema = Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    propertiesVisited:{
      type:[{ type: Schema.Types.ObjectId, ref: 'Project'}]
    },
    citiesVisited:{
      type:[String],
    },
    lastVisitedCity:{type:String, required:false},
    lastVisitedProperty:{type:String, required:false},
    lastVisitedProjectType:{type:String, required:false},
    city: { type: String, required: false },
    state: { type: String, required: false },
    country: { type: String, required: false },
    status: { type: String, required: false }, // closed, followed up, contacted etc.
    sessionId:{type:String ,required:true},
  },
  { timestamps: true }
);

const ChatbotSession = model('ChatbotSession', chatbotSessionSchema);
module.exports = ChatbotSession;
