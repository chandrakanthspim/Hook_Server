const { Flat, Floor } = require("../models");
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const createFlat = async (flatBody) => {
    // const floorCheck=await getFloor()
    const flat = await Flat.create(flatBody)
    return flat
};

const getFlatsByFloorId = async (floorId) => {
    const flat = await Flat.find({ floorId: floorId })
    return flat;
};

const getFlat = async (flatId) => {
    const flat = await Flat.findById(flatId)
    return flat;
};

const updateFlat = async (flatId, updateBody) => {
    const flat = await getFlat(flatId);
    if (!flat) {
        throw new ApiError(httpStatus.NOT_FOUND, 'flat not found');
    }
    // Update flat fields
    Object.keys(updateBody).forEach(key => {
        flat[key] = updateBody[key];
    });
    await flat.save();
    return flat;
};

const deleteFlatsByFloorId = async (floorId) => {
    const flats = await Flat.find({ floorId });
    return await Flat.deleteMany({ floorId });
};

const deleteFlat = async (flatId) => {
        const flat = await getFlat(flatId);
        await flat.remove();
};

module.exports = { createFlat, getFlatsByFloorId, getFlat, updateFlat, deleteFlat, deleteFlatsByFloorId }