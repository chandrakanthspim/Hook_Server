const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const config = require('../config/config');
const adminService = require('./admin.service');
const { Token } = require('../models');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} role
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userData, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userData.id,
    role: userData.role,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} role
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userData, expires, type, blacklisted = false) => {
  if (userData.role === 'admin') {
    if (userData.role !== 'builder' || userData.role !== 'agent') {
      const tokenDoc = await Token.create({
        token,
        admin: userData.id,
        role: userData.role,
        expires: expires.toDate(),
        type,
        blacklisted,
      });
      return tokenDoc;
    } else {
      return null;
    }
  } else if (userData.role === 'builder') {
    const tokenDoc = await Token.create({
      token,
      builder: userData.id,
      role: userData.role,
      expires: expires.toDate(),
      type,
      blacklisted,
    });
    return tokenDoc;
  } else if (userData.role === 'agent') {
    const tokenDoc = await Token.create({
      token,
      agent: userData.id,
      role: userData.role,
      expires: expires.toDate(),
      type,
      blacklisted,
    });
    return tokenDoc;
  } else if (userData.role === 'employee') {
    const tokenDoc = await Token.create({
      token,
      employee: userData.id,
      role: userData.role,
      expires: expires.toDate(),
      type,
      blacklisted,
    });
    return tokenDoc;
  }
};


/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  let query = { token, type, blacklisted: false };

  let role;
  if (payload.role) {
    role = payload.role.toLowerCase();
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Role not found in token payload');
  }

  switch (role) {
    case 'admin':
      query.admin = payload.sub;
      break;
    case 'builder':
      query.builder = payload.sub;
      break;
    case 'agent':
      query.agent = payload.sub;
      break;
    case 'employee':
      query.employee = payload.sub;
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user');
  }

  const tokenDoc = await Token.findOne(query);
  return tokenDoc;
};


/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user, tokenType) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken({ id: user?.id, role: user.role }, accessTokenExpires, tokenTypes.ACCESS);

  let refreshToken = null;
  let refreshTokenExpires = null;

  if (tokenType !== tokenTypes.REFRESH) {
    refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    refreshToken = generateToken({ id: user?.id, role: user.role }, refreshTokenExpires, tokenTypes.REFRESH);
  }

  if (user.role === 'admin') {
    if (tokenType !== tokenTypes.REFRESH) {
      await saveToken(refreshToken, { id: user?.id, role: user.role }, refreshTokenExpires, tokenTypes.REFRESH);
    }
  } else if (user.role === 'builder') {
    if (tokenType !== tokenTypes.REFRESH) {
      await saveToken(refreshToken, { id: user?.id, role: user.role }, refreshTokenExpires, tokenTypes.REFRESH);
    }
  } else if (user.role === 'agent') {
    if (tokenType !== tokenTypes.REFRESH) {
      await saveToken(refreshToken, { id: user?.id, role: user.role }, refreshTokenExpires, tokenTypes.REFRESH);
    }
  } else if (user.role === 'employee') {
    if (tokenType !== tokenTypes.REFRESH) {
      await saveToken(refreshToken, { id: user?.id, role: user.role }, refreshTokenExpires, tokenTypes.REFRESH);
    }
  }

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: refreshToken
      ? {
        token: refreshToken,
        expires: refreshTokenExpires.toDate(),
      }
      : null,
  };
};



/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
  const user = await adminService.getAdminByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken({ id: user.id, role: user.role }, expires, tokenTypes.RESET_PASSWORD);
  await saveToken(resetPasswordToken, { id: user.id, role: user.role }, expires, tokenTypes.RESET_PASSWORD);
  return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (builder) => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = await generateToken({ id: builder._id || builder.id, role: builder.role }, expires, tokenTypes.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, { id: builder.id, role: builder.role }, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
};
