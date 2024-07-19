const httpStatus = require('http-status');
const { State } = require('../models');
const ApiError = require('../utils/ApiError');

const createStateName = async ({ name, country: countryId }) => {
    const stateCheck = await State.findOne({ name, country: countryId });
    if (stateCheck) {
        throw new ApiError(httpStatus.BAD_REQUEST, "State already exists for this country");
    }
    return State.create({ name, country: countryId });
};

const getStates = async () => {
    const state = await State.find({}).populate('country', 'country').populate('cities')
    return state;
};

const getStateById = async (id) => {
    const state = await State.findById(id).populate('country', 'name').populate('cities', 'name')
    if (!state) {
        throw new ApiError(httpStatus.NOT_FOUND, "state not found");
    }
    return state;
};

const updateStateId = async ({ stateId, updateBody }) => {
    const state = await getStateById(stateId);
    const stateData = state.name
    const stateCheck = await State.findOne({ stateData });
    if (stateCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, "state already exists, unable to update");
    }
    Object.assign(state, updateBody);
    await state.save();
    return state;
};

const deleteStateById = async (stateId) => {
    const state = await getStateById(stateId);
    await state.remove();
    return state;
};

module.exports = { createStateName, getStates, getStateById, updateStateId, deleteStateById }