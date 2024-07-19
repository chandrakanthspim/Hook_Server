const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createLeads = {
    body: Joi.object().keys({
        builderId: Joi.string().custom(objectId).required(),
        projectId: Joi.string().custom(objectId).required(),
        employeeId: Joi.string().custom(objectId).required(),
        sessionId: Joi.string().required().trim(),
        name: Joi.string().required().trim(),
        email: Joi.string().required().email().trim(),
        contactNumber: Joi.number().required(),
        status: Joi.string().trim(),
    }),
};

const getLead = {
    params: Joi.object().keys({
        leadId: Joi.string().custom(objectId).required(),
    }),
};

const updateLead = {
    params: Joi.object().keys({
        leadId: Joi.string().custom(objectId).required(),
    }),
    // body: Joi.object().keys({
    //     status: Joi.string().trim().required(),
    // }),
};

const getProjectLeads = {
    params: Joi.object().keys({
        projectId: Joi.string().custom(objectId).required(),
    }),
};

const validIntervals = ['1week', '1month', '3months', '6months', '1year', 'all'];

const intervalsValidate = Joi.object({
    interval: Joi.string().valid(...validIntervals).required(),
});

const deleteLead = {
    params: Joi.object().keys({
        leadId: Joi.string().custom(objectId).required(),
    }),
};

module.exports = { createLeads, getLead, getProjectLeads, updateLead, deleteLead,intervalsValidate }