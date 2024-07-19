const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { ChatbotCustomdataService } = require('../services');

const createCustomData = catchAsync(async (req, res) => {
  // console.log(req.body);
  const {color1,color2,welcomeMessage,chatbotName,leadCaptureAt}=req.body;
  const files=req.files
  const data={
    builderID:req.user._id,
    color1,
    color2,
    welcomeMessage,
    chatbotName,
    leadCaptureAt
  }
  const customData = await ChatbotCustomdataService.createCustomData(data,files);
  res.status(httpStatus.CREATED).send(customData);
});


const getCustomData = catchAsync(async (req, res) => {
  const customData = await ChatbotCustomdataService.getCustomDataByID(req.user._Id);
  if (!customData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Data not found');
  }
  res.send(customData);
});

const updateCustomData = catchAsync(async (req, res) => {
    const files=req.files || undefined;
  const customData = await ChatbotCustomdataService.updateCustomDataById(req.user._Id, req.body,files);
  res.send(customData);
});

const deleteCustomData = catchAsync(async (req, res) => {
  await ChatbotCustomdataService.deleteCustomDataById(req.user._Id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createCustomData,
  getCustomData,
  updateCustomData,
  deleteCustomData
};
