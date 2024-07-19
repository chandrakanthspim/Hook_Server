const mongoose = require('mongoose');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { countryService, adminService, stateService } = require('../services');
const SuccessResponse = require('../utils/ApiResponse');

const createState = catchAsync(async (req, res) => {
    const adminId = req.user._id;
    const countryId = req.params.countryId
    const { name } = req.body;
    if (!mongoose.Types.ObjectId.isValid(countryId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "provide a valid country Id");
    }
    const country = await countryService.getCountryById(countryId);
    if (!country) {
        throw new ApiError(httpStatus.NOT_FOUND, 'country not found');
    }
    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }
    const createState = await stateService.createStateName({ name, country: countryId });
    await country.states.push(createState._id)
    await country.save()
    return new SuccessResponse(httpStatus.CREATED, 'State created successfully', createState).send(res);
});

const getStates = catchAsync(async (req, res) => {
    const adminId = req.user?._id;
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }

    const country = await stateService.getStates();
    return new SuccessResponse(httpStatus.OK, "states retrived successfully", country).send(res);
});

const getState = catchAsync(async (req, res) => {
    const adminId = req.user._id;
    const stateId = req.params.stateId;

    if (!mongoose.Types.ObjectId.isValid(stateId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "provide a valid state Id");
    }
    const state = await stateService.getStateById(stateId);
    return new SuccessResponse(httpStatus.CREATED, 'State retrived successfully', state).send(res);
});

const updateState = catchAsync(async (req, res) => {
    const stateId = req.params.stateId;
    const updateBody = req.body;
    const adminId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }

    const admin = await adminService.getAdminById(adminId);

    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }
    const stateCheck = await stateService.getStateById(stateId);
    if (!stateCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, 'state not found');
    }

    const state = await stateService.updateStateId({ stateId, updateBody });
    return new SuccessResponse(httpStatus.OK, 'state updated successfully', state).send(res);
});

const deleteState = catchAsync(async (req, res) => {
    const adminId = req.user?._id;
    const stateId = req.params.stateId

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "provide a valid admin Id");
    }

    if (!mongoose.Types.ObjectId.isValid(stateId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "provide a valid state Id");
    }
    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }
    const stateCheck = await stateService.getStateById(stateId);
    if (!stateCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, 'state not found');
    }

    await stateService.deleteStateById(stateId);
    return new SuccessResponse(httpStatus.OK, "state deleted successfully").send(res);
});

module.exports = { createState, getStates, getState, updateState, deleteState }