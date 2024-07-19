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

const getApartment = async (projectId, actualUserId) => {
    const apartment = await Apartment.findOne({ project: projectId, createdBy: actualUserId })
    return apartment;
};

const getBuilderApartment = async (builderId) => {
    const apartment = await Apartment.findOne({ createdBy: builderId })
    return apartment;
}

const queryApartments = async (filter, options) => {
    const apartments = await Apartment.paginate(filter, options);
    return apartments;
};

const getApartmentCheck = async (apartmentId) => {
    const apartment = await Apartment.findById(apartmentId)
    return apartment;
};

const updateApartment = async (projectId, builderId, updateBody) => {
    const apartment = await getApartment(projectId, builderId);

    if (!apartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'apartment not found');
    }

    // Parse layout if provided
    if (updateBody.data) {
        updateBody.data = JSON.parse(updateBody.data);
    }

    if (updateBody.$pull && updateBody.$pull.towers) {
        apartment.towers.pull(updateBody.$pull.towers);
        delete updateBody.$pull.towers; // Remove the projects field from updateBody to avoid conflicts with other updates
    }

    // Update apartment fields
    Object.keys(updateBody).forEach(key => {
        apartment[key] = updateBody[key];
    });
    await apartment.save();
    return apartment;
};

const updateApartmentByTower = async (apartmentId, updateBody) => {
    const apartment = await Apartment.findOne(apartmentId);
    if (!apartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'apartment not found');
    }
    if (updateBody.$pull && updateBody.$pull.towers) {
        apartment.towers.pull(updateBody.$pull.towers);
        delete updateBody.$pull.towers;
    }
    // Update apartment fields
    Object.keys(updateBody).forEach(key => {
        apartment[key] = updateBody[key];
    });
    await apartment.save();
    return apartment;
};

const deleteApartment = async (projectId, actualUserId) => {
    const apartment = await getApartment(projectId, actualUserId);
    await apartment.remove();
};

const getStatistics = async (projectId, builderId) => {
    const apartment = await Apartment.findOne({ project: projectId, createdBy: builderId })
        .populate({
            path: 'towers',
            populate: {
                path: 'floors',
                select: 'floorId floorName floorNumber',
                populate: {
                    path: 'flats',
                    select: 'flatId flatStatus flatType flatArea flatAreaInUnits'
                }
            }
        }).exec();
    if (!apartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Apartment data not found');
    }
    return apartment;
};

module.exports = { createApartment, getApartment, queryApartments, getApartmentCheck, updateApartment, updateApartmentByTower, deleteApartment, getStatistics, getBuilderApartment }