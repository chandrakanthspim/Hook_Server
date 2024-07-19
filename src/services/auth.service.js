const httpStatus = require('http-status');
const tokenService = require('./token.service');
const builderAgentService = require('./builder.service');
const adminService = require('./admin.service');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const employeeService = require('./employee.service');
const { UserStatus } = require('../utils/constants');

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const adminLogin = async (email, password) => {
  const admin = await adminService.getAdminByEmail(email);

  if (!admin || !(await admin.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  if (admin && (await admin.isPasswordMatch(password))) {
    return admin;
  }
};

const builderLogin = async (email, password) => {
  const builder = await builderAgentService.getBuilderByEmail(email);

  if (!builder || !(await builder.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  if (builder && (await builder.isPasswordMatch(password))) {
    return builder;
  }
};


const employeeLogin = async (email, password) => {
  const employee = await employeeService.getEmployeeByEmail(email);

  if (!employee || !(await employee.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  if (employee?.status === UserStatus.INACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Account is inactive, please contact builder');
  }

  if (employee && (await employee.isPasswordMatch(password))) {
    return employee;
  }
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */

const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    let user;
    switch (refreshTokenDoc?.role) {
      case 'admin':
        user = await adminService.getAdminById(refreshTokenDoc.admin);
        break;
      case 'builder':
        user = await builderAgentService.getBuilderAgentById(refreshTokenDoc.builder);
        break;
      case 'agent':
        user = await builderAgentService.getBuilderAgentById(refreshTokenDoc.agent);
        break;
      case 'employee':
        user = await employeeService.getEmployeeById(refreshTokenDoc.employee);
        break;
      default:
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user type');
    }

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, `${userType.charAt(0).toUpperCase() + userType.slice(1)} not found`);
    }

    return tokenService.generateAuthTokens(user, refreshTokenDoc?.type);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, error?.message);
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
  if (!resetPasswordTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Link expired or not found,unable to reset password');
  }
  let role = resetPasswordTokenDoc?.role

  switch (role) {
    case 'admin':
      const admin = await adminService.getAdminById(resetPasswordTokenDoc.admin);
      if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found unable to reset password');
      }
      if (admin) {
        await adminService.updateAdminById(admin.id, { password: newPassword });
        await Token.deleteMany({ admin: admin.id, type: tokenTypes.RESET_PASSWORD });
      }
      break;
    case 'builder':
      const builder = await builderAgentService.getBuilderAgentById(resetPasswordTokenDoc.builder, role);
      if (!builder) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Builder not found unable to reset password');
      }
      if (builder) {
        await builderAgentService.updateBuilderById(builder.id, { password: newPassword }, role);
        await Token.deleteMany({ builder: builder.id, type: tokenTypes.RESET_PASSWORD });
      }
      break;
    case 'agent':
      const agent = await builderAgentService.getBuilderAgentById(resetPasswordTokenDoc.agent, role);
      if (!agent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found unable to reset password');
      }
      if (agent) {
        await builderAgentService.updateBuilderById(agent.id, { password: newPassword }, role);
        await Token.deleteMany({ agent: agent.id, type: tokenTypes.RESET_PASSWORD });
      }
      break;
    case 'employee':
      const employee = await employeeService.getEmployeeById(resetPasswordTokenDoc.employee);
      if (!employee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found unable to reset password');
      }
      if (employee) {
        await employeeService.updateEmployeeById(employee.id, { password: newPassword }, employee.createdBy);
        await Token.deleteMany({ employee: employee.id, type: tokenTypes.RESET_PASSWORD });
      }
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);

    if (!verifyEmailToken) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email verification failed: Invalid verification link or email already verified');
    }

    const identifier = verifyEmailTokenDoc.agent || verifyEmailTokenDoc.builder;
    const role = verifyEmailTokenDoc.role;

    const builder = await builderAgentService.getBuilderAgentById(identifier, role);

    if (!builder) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Email verification failed: role} agent not found`);
    }

    if (builder.isEmailVerified) {
      return 'already_verified';
    }

    if (verifyEmailTokenDoc.expires < Date.now()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email verification failed: The verification link has expired.');
    }

    await builderAgentService.updateBuilderById(builder._id, { isEmailVerified: true }, builder?.role);
    // await Token.deleteMany({ builder: builder._id, type: tokenTypes.VERIFY_EMAIL });
    return 'verified';

  } catch (error) {
    if (error.message.includes('expired')) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email verification failed: The verification link has expired.');
    } else if (error.message.includes('already verified')) {
      return 'already_verified';
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'An error occurred during email verification');
    }
  }
};


module.exports = {
  builderLogin,
  adminLogin,
  employeeLogin,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
};
