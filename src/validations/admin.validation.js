const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const getAdmin = {
    params: Joi.object().keys({
        adminId: Joi.string().custom(objectId),
    }),
};

module.exports = { getAdmin }