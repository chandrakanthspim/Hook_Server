const { Schema, model } = require('mongoose');

const requestSchema = new Schema({
    userId: {type:String,required:true},
    roomId: {type:String,required:true},
    timestamp: { type: Date, default: Date.now },
  },{
    timestamps: true
});
  
const Request = model('Request', requestSchema);
module.exports=Request