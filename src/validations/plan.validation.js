const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { PlanType, PlanStatus, PlanUnit } = require('../utils/constants');

const planValidationSchema = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    planType: Joi.string().valid(PlanType.FREE, PlanType.SILVER, PlanType.GOLD, PlanType.DIAMOND).required(),
    price: Joi.number().positive(),
    noOfProjects: Joi.number().positive().required(),
    noOfEmployees: Joi.number().positive().required(),
    status: Joi.string().valid(PlanStatus.ACTIVE, PlanStatus.INACTIVE, PlanStatus.ON_HOLD),
    durationValue: Joi.number().positive().allow(0).required(),
    durationUnit: Joi.string().valid(PlanUnit.MONTHLY, PlanUnit.YEARLY).required(),
    createdBy: Joi.string().custom(objectId),
    discountPercentage: Joi.number().positive().allow(0).max(100),
  })
};


const getPlan = {
  params: Joi.object().keys({
    planId: Joi.string().custom(objectId),
  })
};

const updatePlan = {
  params: Joi.object().keys({
    planId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      planType: Joi.string().valid(PlanType.FREE, PlanType.SILVER, PlanType.GOLD, PlanType.DIAMOND),
      price: Joi.number(),
      noOfProjects: Joi.number().positive(),
      noOfEmployees: Joi.number().positive(),
      status: Joi.string().valid(PlanStatus.ACTIVE, PlanStatus.INACTIVE, PlanStatus.ON_HOLD),
      durationValue: Joi.number().positive().allow(0),
      durationUnit: Joi.string().valid(PlanUnit.MONTHLY, PlanUnit.YEARLY),
      createdBy: Joi.string().custom(objectId),
      discountPercentage: Joi.number().positive().allow(0).max(100),
    })
};

module.exports = { planValidationSchema, getPlan, updatePlan }