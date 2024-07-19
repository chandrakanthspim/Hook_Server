const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { ProjectStatus, ProjectType, ApprovalType } = require('../utils/constants');



const createProject = {
  body: Joi.object().keys({
    title: Joi.string().min(4).required().messages({
      'string.min': 'please enter project name of above 4 characters',
      'any.required': 'please enter project title'
    }),
    description: Joi.string().required().messages({
      'any.required': 'please enter project description'
    }),
    price: Joi.number().required().messages({
      'any.required': 'please enter project price'
    }),
    contactNumber: Joi.string().regex(/^\d+$/).required().messages({
      'string.pattern.base': 'please enter a valid project mobile number',
      'any.required': 'please enter a project mobile number'
    }),
    area: Joi.number().positive().required().messages({
      'number.positive': 'please enter a positive number for area',
      'any.required': 'please enter the area of the project'
    }),
    address: Joi.string().required().messages({
      'any.required': 'please enter project address'
    }),
    city: Joi.string().required().messages({
      'any.required': 'please enter the city'
    }),
    state: Joi.string().required().messages({
      'any.required': 'please enter the state'
    }),
    country: Joi.string().required().messages({
      'any.required': 'please enter the country'
    }),
    pincode: Joi.number().positive().required().messages({
      'number.positive': 'please enter a positive number for pincode',
      'any.required': 'please enter the pincode'
    }),
    amenities: Joi.array().items(Joi.string().uri()).messages({
      'array.base': 'amenities should be an array of URLs'
    }),
    highlights: Joi.array().items(Joi.string().uri()).messages({
      'array.base': 'highlights should be an array of URLs'
    }),
    layout: Joi.array().items(Joi.string().uri()).messages({
      'array.base': 'layout should be an array of URLs'
    }),
    floorPlans: Joi.array().items(Joi.string().uri()).messages({
      'array.base': 'floorPlans should be an array of URLs'
    }),
    locationMap: Joi.array().items(Joi.string().uri()).messages({
      'array.base': 'locationMap should be an array of URLs'
    }),
    completionYear: Joi.number().positive().required().messages({
      'number.positive': 'please enter a valid positive number for completion year',
      'any.required': 'please enter the completion year'
    }),
    videos: Joi.array().items(Joi.string().uri()).messages({
      'array.base': 'videos should be an array of URLs'
    }),
    gallery: Joi.array().items(Joi.string().uri()).messages({
      'array.base': 'gallery should be an array of URLs'
    }),
    docs: Joi.array().items(Joi.string().uri()).messages({
      'array.base': 'docs should be an array of URLs'
    }),
    category: Joi.string().required().messages({
      'any.required': 'please select a project type'
    }),
    employeeId: Joi.string().custom(objectId).required().messages({
      'any.required': 'please enter the employee ID'
    }),
    createdBy: Joi.string().custom(objectId).required().messages({
      'any.required': 'please enter the creator ID'
    }),
    status: Joi.string().valid(
      ProjectStatus.PRE_LAUNCH,
      ProjectStatus.IN_PROGRESS,
      ProjectStatus.COMPLETED
    ).required().messages({
      'any.required': 'please select a project status'
    }),
    approval: Joi.object().keys({
      type: Joi.string().valid(
        ApprovalType.RERA,
        ApprovalType.HMDA,
        ApprovalType.DTCP
      ).messages({
        'any.only': 'please select a valid approval type'
      }),
      value: Joi.string().allow(null, '').messages({
        'string.base': 'approval value should be a string'
      })
    }).optional()
  }),
};

module.exports = createProject;


const getProject = {
  params: Joi.object().keys({
    projectId: Joi.string().custom(objectId),
  }),
};

const getProjects = {
  query: Joi.object().keys({
    title: Joi.string(),
    reraId: Joi.string(),
    contactNumber: Joi.number(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const updateProject = {
  params: Joi.object().keys({
    projectId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      description: Joi.string(),
      price: Joi.number(),
      contactNumber: Joi.string(),
      images: Joi.array().items(Joi.string()),
      area: Joi.number(),
      amenities: Joi.array().items(Joi.string()),
      facing: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
      pincode: Joi.string(),
      highlights: Joi.array().items(Joi.string()),
      layout: Joi.string(),
      floorPlans: Joi.string(),
      locationMap: Joi.array().items(Joi.string()),
      virtualTour: Joi.string(),
      completionYear: Joi.string(),
      videos: Joi.array().items(Joi.string()),
      gallery: Joi.array().items(Joi.string()),
      docs: Joi.array().items(Joi.string()),
      category: Joi.string().valid(
        ProjectType.COMMERCIAL,
        ProjectType.FARM_LAND,
        ProjectType.PLOTTING,
        ProjectType.RESIDENTIAL,
        ProjectType.VILLAS
      ),
      employeeId: Joi.string().custom(objectId),
      status: Joi.string().valid(
        ProjectStatus.PRE_LAUNCH,
        ProjectStatus.IN_PROGRESS,
        ProjectStatus.COMPLETED
      ),
    })
    .min(1),
};

module.exports = { createProject, getProject, getProjects, updateProject }