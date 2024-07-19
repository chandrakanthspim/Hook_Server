const httpStatus = require('http-status');
const { ChatbotCustomData } = require('../models');
const ApiError = require('../utils/ApiError');
const { s3DeleteSingle, s3UploadSingle, getSignedUrlMultiple, getSignedUrl } = require('./s3.service');

const logokeyPrefix = 'chatBot/customData/logo';

const createCustomData = async (CustomDataBody,files) => {
  // console.log('in CustomData service', CustomDataBody);
  try{
  if (files) {
    for (let f of Object.entries(files)) {
      // console.log(f);
      for (let x of f[1]) {
        x.filename = `${Date.now()}-spim-${x.originalname}`;
      }
    }
  }
  const data = {...CustomDataBody,profileImageUrl:files['logo'][0].filename };
  await s3UploadSingle(files['logo'][0], logokeyPrefix)
  return ChatbotCustomData.create(data);}
  catch(err){
    console.log(err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create ChatbotCustomData');
  }
};


/**
 * Get subscription by id
 * @param {ObjectId} id
 * @returns {Promise<Subscription>}
 */
const getCustomDataByID = async (Id) => {
  return ChatbotCustomData.findOne({ builderID: Id });
};

/**
 * Update subscription by plantype
 * @param {ObjectId} planType
 * @param {Object} updateBody
 * @returns {Promise<Subscription>}
 */
const updateCustomDataById = async (Id, updateBody,files) => {
  const customData = await getCustomDataByID(Id);
  if (!customData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ChatbotCustomData not found');
  }
  if(files!=undefined){
    if (files) {
        for (let f of Object.entries(files)) {
          // console.log(f);
          for (let x of f[1]) {
            x.filename = `${Date.now()}-spim-${x.originalname}`;
          }
        }
      }
  }
  try{
    await s3DeleteSingle(customData.profileImageUrl,logokeyPrefix)
    await s3UploadSingle(files['logo'][0], logokeyPrefix)
    if(files!=undefined) {
        updateBody.profileImageUrl = files['logo'][0].filename;
    }
  
  Object.assign(customData, updateBody);
  // console.log(customData);
  await customData.save();
  return customData;
}catch(err){
    console.log(err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update ChatbotCustomData');
}
};

/**
 * Delete subscription by planType
 * @param {ObjectId} planType
 * @returns {Promise<Subscription>}
 */
const deleteCustomDataById = async (Id) => {
  const customData = await getcustomDataByPlanType(Id);
  try{
  if (!customData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'customData not found');
  }
  await s3DeleteSingle(customData.profileImageUrl,logokeyPrefix)
  await customData.remove();
  return customData;
}catch(err){
    console.log(err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete ChatbotCustomData');
}
};



module.exports = {
  createCustomData,
  getCustomDataByID,
  updateCustomDataById,
  deleteCustomDataById,
};
