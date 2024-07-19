const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { builderAgentService, planService } = require('../services');
const SuccessResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const { RoleType } = require('../utils/constants');
const { checkUser } = require('../services/admin.service');

const getBuilders = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullName', 'role', 'plan', 'email', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const builderData = await builderAgentService.queryBuilders(filter, options);
  return new SuccessResponse(httpStatus.OK, 'Builders data retrived successfully', builderData).send(res);
});

const getAgents = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullName', 'role', 'plan', 'email', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const builderData = await builderAgentService.queryBuilders(filter, options);
  return new SuccessResponse(httpStatus.OK, 'Agents data retrived successfully', builderData).send(res);
});

const getBuilderAgent = catchAsync(async (req, res) => {
  const { _id: userId, role: userRole } = req.user;
  const adUserId = req.params.userId;
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

  let user;
  let userType;
  if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
    throw new ApiError(httpStatus.NOT_FOUND, `Provide valid Builder Id`);
  }

  switch (userRole) {
    case 'admin':
      const admin = await getAdminById(userId);
      if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
      }
      const findBuilder = await builderAgentService.getBuilderAgentById(actualUserId);
      if (!findBuilder) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Builder not found');
      }
      break;
    case 'builder':
      userType = RoleType.BUILDER
      user = await builderAgentService.getBuilderAgentById(actualUserId);
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Builder not found');
      }
      break;
    case 'agent':
      userType = RoleType.AGENT
      user = await builderAgentService.getBuilderAgentById(actualUserId);
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
      }
      break;
  }

  return new SuccessResponse(httpStatus.OK, `${userType} details retrieved successfully`, user).send(res);
});

const updateBuilder = catchAsync(async (req, res) => {
  const updateBody = req.body;
  const { _id: userId, role: userRole } = req.user;
  const adUserId = req.params.userId;
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

  if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
    throw new ApiError(httpStatus.NOT_FOUND, `Provide valid builder Id`);
  }
  const builderCheck = await builderAgentService.getBuilderAgentById(actualUserId);
  const actualUserRole = userRole === RoleType.ADMIN ? builderCheck.role : userRole;
  const builder = await builderAgentService.updateBuilderById(actualUserId, updateBody, userRole);
  return new SuccessResponse(httpStatus.OK, `${actualUserRole} details updated successfully`, builder).send(res);
});

const upgradePlan = catchAsync(async (req, res) => {
  const { _id: userId, role: userRole } = req.user;
  const adUserId = req.params.userId;
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;
  const updateBody = req.body

  if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
    throw new ApiError(httpStatus.NOT_FOUND, `Provide valid Builder Id`);
  }

  await checkUser(userRole, userId, actualUserId)
  const planCheck = await planService.getPlanById(updateBody.plan);
  if (!planCheck) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Selected plan does not exist');
  }
  const builder = await builderAgentService.upgradePlan(actualUserId, updateBody, planCheck, userRole);
  return new SuccessResponse(httpStatus.OK, `plan upgraded successfully`, builder).send(res);
})

//only access for admin
const deleteBuilder = catchAsync(async (req, res) => {
  const { _id: userId, role: userRole } = req.user;
  const adUserId = req.params.userId;
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;
  let role = req.path.includes('builder') ? 'builder' : 'agent'

  if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provide valid Builder Id');
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid Admin Id");
  }
  await checkUser(userRole, userId, actualUserId)
  await builderAgentService.deleteBuilderById(actualUserId, userRole, role);
  return new SuccessResponse(httpStatus.OK, `${role} deleted successfully`).send(res);
});

const deleteAgent = catchAsync(async (req, res) => {
  const { _id: userId, role: userRole } = req.user;
  const adUserId = req.params.userId;
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;
  let role = req.path.includes('builder') ? 'builder' : 'agent'

  if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provide valid Agent Id');
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid Admin Id");
  }
  await checkUser(userRole, userId, actualUserId)
  await builderAgentService.deleteBuilderById(actualUserId, userRole, role);
  return new SuccessResponse(httpStatus.OK, `${role} deleted successfully`).send(res);
});

module.exports = {
  getBuilders,
  getAgents,
  getBuilderAgent,
  updateBuilder,
  deleteBuilder,
  deleteAgent,
  upgradePlan
};
