const Joi = require('joi');
const { password, roleType, objectId } = require('./custom.validation');
const { Gender } = require('../utils/constants');

const adminRegister = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    fullName: Joi.string().required(),
    contactNumber: Joi.number(),
    role: Joi.string().valid('builder', 'admin'),
    gender: Joi.string().valid(Gender.MALE,Gender.FEMALE,Gender.OTHERS)
  }),
};

const builderRegister = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    fullName: Joi.string().required(),
    address: Joi.string(),
    contactNumber: Joi.number(),
    paidAmount:Joi.number().positive().allow(0).required(),
    role: Joi.string().valid('builder', 'admin'),
    gender: Joi.string().valid(Gender.MALE,Gender.FEMALE,Gender.OTHERS),
    plan: Joi.string().custom(objectId)
  }),
};

const employeeRegister = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    fullName: Joi.string().required(),
    contactNumber: Joi.number().required(),
    role: Joi.string().valid('employee'),
    gender: Joi.string().valid(Gender.MALE,Gender.FEMALE,Gender.OTHERS).required()
  }),
};

module.exports = {
  adminRegister,
  builderRegister, employeeRegister
};


const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

module.exports = {
  adminRegister,
  builderRegister,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
