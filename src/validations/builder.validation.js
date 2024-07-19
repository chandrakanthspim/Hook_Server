const Joi = require('joi');
const { password, objectId } = require('./custom.validation');
const { email } = require('../config/config');

const getBuilders = {
  query: Joi.object().keys({
    fullName: Joi.string(),
    role: Joi.string(),
    email: Joi.string(),
    status: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getBuilder = {
  params: Joi.object().keys({
    builderId: Joi.string().custom(objectId),
  }),
};

const updateBuilder = {
  params: Joi.object().keys({
    builderId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      fullName: Joi.string(),
      // email: Joi.string(),
      profilePic: Joi.string(),
      contactNumber: Joi.number(),
      address: Joi.string()
    })
    .min(1),
};

const deleteBuilder = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  getBuilders,
  getBuilder,
  updateBuilder,
  deleteBuilder,
};
