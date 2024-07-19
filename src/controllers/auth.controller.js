const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, tokenService, emailService, adminService, planService, employeeService, builderAgentService } = require('../services');
const SuccessResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const moment = require('moment');
const config = require('../config/config');
const { generateToken, saveToken } = require('../services/token.service');
const { tokenTypes } = require('../config/tokens');
const { isEmailTaken } = require('../middlewares/email.check');
const { PlanStatus, RoleType } = require('../utils/constants');

const adminRegister = catchAsync(async (req, res) => {
  const adminBody = req.body
  const emailTaken = await isEmailTaken(adminBody.email);
  if (emailTaken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already exists');
  }
  const admin = await adminService.createAdmin(adminBody);
  const tokens = await tokenService.generateAuthTokens(admin);
  return new SuccessResponse(201, 'Admin registred successfully', tokens).send(res);
});

const adminLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const admin = await authService.adminLogin(email, password);
  const tokens = await tokenService.generateAuthTokens(admin);
  res.cookie('jwt', tokens.access.token, {
    expires: tokens.access.expires,
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  return new SuccessResponse(200, 'Admin sign in successfully', tokens).send(res);
});

const builderAgentRegister = catchAsync(async (req, res) => {
  const { plan, paidAmount, remainingAmount, comment, ...builderAgentBody } = req.body;
  const role = req.user?.role;
  const adminId = req.user?._id;
  const typeOfRole = req.path.includes('builder') ? RoleType.BUILDER : RoleType.AGENT;

  const emailTaken = await isEmailTaken(builderAgentBody.email);
  if (emailTaken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already exists');
  }

  const findAdmin = await adminService.getAdminById(adminId);
  if (!findAdmin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found, unable to create project');
  }

  const planCheck = await planService.getPlanById(plan);
  if (!planCheck) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Selected plan does not exist');
  }

  if (planCheck.status !== PlanStatus.ACTIVE) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Selected plan status is inactive, unable to create ${typeOfRole}`);
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + planCheck.duration.value);

  const builderAgentData = {
    ...builderAgentBody,
    plan: {
      planId: plan,
      paidAmount,
      remainingAmount: planCheck.price - paidAmount,
      comment,
      planExpiry: expiryDate,
      date: new Date(),
    },
    createdBy: adminId,
    role: typeOfRole,
  };

  const builderAgent = await builderAgentService.createBuilderAgent(builderAgentData, role);

  const planHistoryItem = {
    plan: planCheck._id,
    paidAmount,
    remainingAmount: planCheck.price - paidAmount,
    date: new Date(),
    comment,
  };

  builderAgent.planHistory.push(planHistoryItem);
  await builderAgent.save();

  planCheck.userCount = planCheck.userCount ? planCheck.userCount + 1 : 1;
  await planCheck.save();

  const tokens = await tokenService.generateAuthTokens(builderAgent);
  const verificationToken = await tokenService.generateVerifyEmailToken(builderAgent);
  await emailService.sendVerificationEmail(builderAgent.email, verificationToken);

  return new SuccessResponse(httpStatus.CREATED, `${typeOfRole} registered successfully`, tokens).send(res);
});

const builderAgentLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  let user;
  let userType;
  const typeOfRole = req.path.includes('builder') ? RoleType.BUILDER : RoleType.AGENT;

  userType = user ? RoleType.BUILDER : RoleType.AGENT;

  if (!user && typeOfRole === RoleType.BUILDER) {
    user = await authService.builderLogin(email, password);
    userType = user ? RoleType.BUILDER : null;
  }

  if (!user && typeOfRole === RoleType.AGENT) {
    user = await authService.builderLogin(email, password);
    userType = user ? RoleType.AGENT : null;
  }

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const tokens = await tokenService.generateAuthTokens(user);

  res.cookie('jwt', tokens.access.token, {
    expires: tokens.access.expires,
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  return new SuccessResponse(200, `${userType} sign in successful`, tokens).send(res);
});

const employeeRegister = catchAsync(async (req, res) => {
  const employeeBody = req.body
  const { _id: userId, role: userRole } = req.user;
  const adUserId = req.params.id;
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

  const emailTaken = await isEmailTaken(employeeBody.email);
  if (emailTaken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already exists');
  }
  const findBuilder = await builderAgentService.getBuilderAgentById(actualUserId);
  if (!findBuilder) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Builder not found unable to create project');
  }
  const actualUserRole = userRole === RoleType.ADMIN ? findBuilder.role : userRole;

  const builderPlan = await planService.getPlanById(findBuilder.plan.planId);
  if (!builderPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found for the builder');
  }

  if (!Array.isArray(findBuilder.employees)) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error occured try again');
  }

  if (findBuilder.employees.length >= builderPlan.noOfEmployees) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Maximum number of employees reached for the plan');
  }
  const employeeData = { createdBy: actualUserId, ...employeeBody };
  const employee = await employeeService.createEmployee(employeeData, actualUserRole);
  await findBuilder.employees.push(employee?.id);
  await findBuilder.save();
  const tokens = await tokenService.generateAuthTokens(employee);
  return new SuccessResponse(201, 'Employee registered successfully', tokens).send(res);
});

const employeeLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.employeeLogin(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.cookie('jwt', tokens.access.token, {
    expires: tokens.access.expires,
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  return new SuccessResponse(200, 'Employee sign in successfully', tokens).send(res);
});

const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body
  await authService.logout(refreshToken);
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  return new SuccessResponse(200, 'Sign out successfully',).send(res);
});

const refreshTokens = catchAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken
  const tokens = await authService.refreshAuth(refreshToken);
  return new SuccessResponse(201, 'Refresh tokens created successfully', { ...tokens }).send(res);
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const userType = req.url.split('/')[1];

  let user;
  if (userType === 'admin') {
    user = await adminService.getAdminByEmail(email);
  } else if (userType === 'builder') {
    user = await builderAgentService.getBuilderByEmail(email);
  } else if (userType === 'agent') {
    user = await builderAgentService.getAgentByEmail(email);
  } else if (userType === 'employee') {
    user = await employeeService.getEmployeeByEmail(email);
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user type');
  }

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }

  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken({ id: user.id, role: user.role }, expires, tokenTypes.RESET_PASSWORD);
  await saveToken(resetPasswordToken, { id: user.id, role: user.role }, expires, tokenTypes.RESET_PASSWORD);
  await emailService.sendResetPasswordEmail(email, resetPasswordToken);
  return new SuccessResponse(httpStatus.OK, 'Forgot password link sent to your registered mail Id').send(res);
});

const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.query
  const { password } = req.body;
  await authService.resetPassword(token, password);
  return new SuccessResponse(httpStatus.OK, 'Password updated successfully',).send(res);
});

const updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { id, role } = req.user;
  let user;
  let userEmail;

  if (currentPassword === newPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current & New passwords are same unable to update');
  }
  switch (role) {
    case 'admin':
      userEmail = await adminService.getAdminById(id);
      user = await adminService.getAdminByEmail(userEmail.email)
      break;
    case 'builder':
      userEmail = await builderAgentService.getBuilderAgentById(id);
      user = await builderAgentService.getBuilderByEmail(userEmail.email)
      break;
    case 'agent':
      userEmail = await builderAgentService.getBuilderAgentById(id);
      user = await builderAgentService.getBuilderByEmail(userEmail.email)
      break;
    case 'employee':
      userEmail = await employeeService.getEmployeeById(id);
      user = await employeeService.getEmployeeByEmail(userEmail.email)
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user type');
  }

  const isMatch = await user.isPasswordMatch(currentPassword);
  if (!isMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Current password is incorrect');
  }

  switch (role) {
    case 'admin':
      await adminService.updatePassword(id, newPassword);
      break;
    case 'builder':
      await builderAgentService.updateBuilderPassword(id, newPassword);
      break;
    case 'agent':
      await builderAgentService.updateAgentPassword(id, newPassword);
      break;
    case 'employee':
      await employeeService.updateEmployeePassword(id, newPassword);
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user type');
  }
  return new SuccessResponse(httpStatus.OK, 'Password updated successfully').send(res);
});

const updateBuilderPasswordByAdmin = catchAsync(async (req, res) => {
  const { _id: userId, role: userRole } = req.user;
  const { currentPassword, newPassword } = req.body;
  const { builderId } = req.params;

  let user;
  let userEmail;

  if (currentPassword === newPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current password and New password should not be same');
  }

  switch (userRole) {
    case 'admin':
      await adminService.getAdminById(userId);
      userEmail = await builderAgentService.getBuilderAgentById(builderId);
      user = await builderAgentService.getBuilderByEmail(userEmail.email);
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user type');
  }

  const isCurrentPasswordMatch = await user.isPasswordMatch(currentPassword);
  if (!isCurrentPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Current password is incorrect');
  }

  const isNewPasswordValid = validateNewPassword(newPassword);
  if (!isNewPasswordValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password must contain at least one capital letter and one number');
  }

  await builderAgentService.updateBuilderPassword(builderId, newPassword);
  return new SuccessResponse(httpStatus.OK, 'Password updated successfully').send(res);
});

const updateEmployeePasswordByBuilder = catchAsync(async (req, res) => {
  const { _id: userId, role: userRole } = req.user;
  const { currentPassword, newPassword } = req.body;
  const { employeeId } = req.params;

  let user;
  let userEmail;
  let builder;

  if (currentPassword === newPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current password and New password should not be same');
  }

  switch (userRole) {
    case 'builder':
    case 'agent':
      builder = await builderAgentService.getBuilderAgentById(userId);
      userEmail = await employeeService.getEmployeeBuilderAgentById(employeeId, builder.id);
      user = await employeeService.getEmployeeByEmail(userEmail.email);
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user type');
  }

  const isCurrentPasswordMatch = await user.isPasswordMatch(currentPassword);
  if (!isCurrentPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Current password is incorrect');
  }

  const isNewPasswordValid = validateNewPassword(newPassword);
  if (!isNewPasswordValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password must contain at least one capital letter and one number');
  }

  await employeeService.updateEmployeePassword(employeeId, newPassword);
  return new SuccessResponse(httpStatus.OK, 'Password updated successfully').send(res);
});

const validateNewPassword = (password) => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  return new SuccessResponse(201, 'Verification email sent successfully').send(res);
});

const verifyEmail = catchAsync(async (req, res) => {
  const verifyToken = req.query.token;

  const result = await authService.verifyEmail(verifyToken);
  if (result === 'verified') {
    return new SuccessResponse(httpStatus.OK, 'Email verified successfully').send(res);
  } else if (result === 'already_verified') {
    return new SuccessResponse(httpStatus.OK, 'Email is already verified').send(res);
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'An error occurred during email verification');
  }
});

module.exports = {
  adminRegister,
  adminLogin,
  builderAgentRegister,
  builderAgentLogin,
  employeeRegister,
  employeeLogin,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  updatePassword,
  updateEmployeePasswordByBuilder,
  updateBuilderPasswordByAdmin
};
