const {User, ChatbotSession } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');



const getchatbotSessionById=async(sessionId)=>{
  return ChatbotSession.findOne({sessionId})
}

const createSessionData = async (sessionData) => {
  try {
    // console.log(sessionData)
    const { city, country, state, status,  sessionId} =sessionData;

    const foundData = await ChatbotSession.findOne({ sessionId });
    
    if(foundData){
        throw new ApiError(httpStatus.BAD_REQUEST, 'Session already exists');
    }
    
    const newSessiondata= await ChatbotSession.create({
        city,
        country,
        state,
        status,
        sessionId
      })

      
    return newSessiondata;
  } catch (err) {
    console.log(err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

const updatechatbotSessionById = async (updateBody) => {
  try {
    const { sessionId } = req.params;
    const { city, priority, property, status, source, description } = updateBody;

    const foundData = await ChatbotSession.findOne({sessionId})
    if(!foundData) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Session not found');
    }

    
    return foundData;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};


module.exports = {
createSessionData,
  getchatbotSessionById,
  updatechatbotSessionById,
};
