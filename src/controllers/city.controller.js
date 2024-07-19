const mongoose = require('mongoose');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { cityService, adminService, stateService } = require('../services');
const SuccessResponse = require('../utils/ApiResponse');

const createCity = catchAsync(async (req, res) => {
    const adminId = req.user._id;
    const stateId = req.params.stateId
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(stateId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Provide a valid state Id");
    }

    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }

    const state = await stateService.getStateById(stateId);
    if (!state) {
        throw new ApiError(httpStatus.NOT_FOUND, 'State not found');
    }

    const createdCity = await cityService.createCityName({ name,stateId });
    await state.cities.push(createdCity._id)
    await state.save()
    return new SuccessResponse(httpStatus.CREATED, 'City created successfully', createdCity).send(res);
});

const getCities = catchAsync(async (req, res) => {
    const cities = await cityService.getCities();
    return new SuccessResponse(httpStatus.OK, "Cities retrieved successfully", cities).send(res);
});

const getCity = catchAsync(async (req, res) => {
    const adminId = req.user._id;
    const cityId = req.params.cityId;

    if (!mongoose.Types.ObjectId.isValid(cityId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Provide a valid city Id");
    }

    const city = await cityService.getCityById(cityId);
    if (!city) {
        throw new ApiError(httpStatus.NOT_FOUND, 'City not found');
    }

    return new SuccessResponse(httpStatus.OK, 'City retrieved successfully', city).send(res);
});

const updateCity = catchAsync(async (req, res) => {
    const cityId = req.params.cityId;
    const updateBody = req.body;

    if (!mongoose.Types.ObjectId.isValid(cityId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Provide a valid city Id");
    }

    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }

    const updatedCity = await cityService.updateCityById(cityId, updateBody);
    return new SuccessResponse(httpStatus.OK, 'City updated successfully', updatedCity).send(res);
});

const deleteCity = catchAsync(async (req, res) => {
    const adminId = req.user._id;
    const cityId = req.params.cityId;

    if (!mongoose.Types.ObjectId.isValid(cityId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Provide a valid city Id");
    }
    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }

    await cityService.deleteCityById(cityId);
    return new SuccessResponse(httpStatus.OK, "City deleted successfully").send(res);
});

module.exports = {
    createCity,
    getCities,
    getCity,
    updateCity,
    deleteCity
};
