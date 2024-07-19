const mongoose = require('mongoose');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { countryService, adminService } = require('../services');
const SuccessResponse = require('../utils/ApiResponse');

const createCountry = catchAsync(async (req, res) => {
    const adminId = req.user._id;
    const { name } = req.body

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }

    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }

    const createdCountry = await countryService.createCountryName({ name });
    return new SuccessResponse(httpStatus.CREATED, 'country created successfully', createdCountry).send(res);
});

const getCountry = catchAsync(async (req, res) => {
    const adminId = req.user?._id;
    const countryId = req.params.countryId

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }

    if (!mongoose.Types.ObjectId.isValid(countryId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid country Id");
    }
    const country = await countryService.getCountryById(countryId);
    return new SuccessResponse(httpStatus.OK, "country retrived successfully", country).send(res);
});

const getCountries = catchAsync(async (req, res) => {
    const adminId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }

    const country = await countryService.getCountries();
    return new SuccessResponse(httpStatus.OK, "countries retrived successfully", country).send(res);
});

const updateCountry = catchAsync(async (req, res) => {
    const countryId = req.params.countryId;
    const updateBody = req.body;
    const adminId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }

    const admin = await adminService.getAdminById(adminId);

    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }
    const countryCheck = await countryService.getCountryById(countryId);
    if (!countryCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, 'country not found');
    }

    const country = await countryService.updateCountryId({ countryId, updateBody });
    return new SuccessResponse(httpStatus.OK, 'country updated successfully', country).send(res);
});

const deleteCountry = catchAsync(async (req, res) => {
    const adminId = req.user?._id;
    const countryId = req.params.countryId

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "provide a valid admin Id");
    }

    if (!mongoose.Types.ObjectId.isValid(countryId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "provide a valid country Id");
    }
    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }
    const countryCheck = await countryService.getCountryById(countryId);
    if (!countryCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, 'country not found');
    }

    await countryService.deleteCountryById(countryId);
    return new SuccessResponse(httpStatus.OK, "country deleted successfully").send(res);
});

module.exports = { createCountry, getCountry, getCountries, updateCountry, deleteCountry }