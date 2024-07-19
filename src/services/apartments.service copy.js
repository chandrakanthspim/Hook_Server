const httpStatus = require("http-status");
const { Apartment } = require("../models");
const ApiError = require("../utils/ApiError");

const createApartment = async (apartmentBody) => {
    const apartmentCheck = await Apartment.findOne({ project: apartmentBody.project, createdBy: apartmentBody.createdBy })
    if (apartmentCheck) {
        throw new ApiError(httpStatus.FORBIDDEN, 'apartment already exists for this project');
    }
    return await Apartment.create(apartmentBody)
};

const getApartment = async ({ projectId, builderId }) => {
    const apartment = await Apartment.findOne({ project: projectId, createdBy: builderId })
    return apartment;
};

const deletePlotting = async ({ projectId, builderId }) => {
    try {
        const apartment = await getApartment(projectId, builderId);
        await apartment.remove();
    } catch (err) {
        console.log(err);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete availibility');
    }
};

module.exports = { createApartment, getApartment, deletePlotting }