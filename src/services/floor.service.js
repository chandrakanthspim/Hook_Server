const { Floor } = require("../models");
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError')

const createFloor = async (towerBody) => {
    const floor = await Floor.create(towerBody)
    return floor;
};


const getFloorsByTowerId = async (towerId) => {
    const floor = await Floor.find({ towerId: towerId })
    return floor;
};

const getFloor = async (floorId) => {
    const floor = await Floor.findById(floorId)
    return floor;
};

const updateFloor = async (floorId, updateBody) => {
    const floor = await getFloor(floorId);
    if (!floor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'floor not found');
    }
    if (updateBody.$pull && updateBody.$pull.flats) {
        floor.flats.pull(updateBody.$pull.flats);
        delete updateBody.$pull.flats;
    }
    // Update floor fields
    Object.keys(updateBody).forEach(key => {
        floor[key] = updateBody[key];
    });
    await floor.save();
    return floor;
};

const deleteFloorsByTowerId = async (towerId) => {
    const floors = await Floor.find({ towerId });
    return await Floor.deleteMany({ towerId });
};

const deleteFloor = async (floorId) => {
        const floor = await getFloor(floorId);
        await floor.remove();
};

module.exports = { createFloor, getFloorsByTowerId, getFloor, updateFloor, deleteFloor, deleteFloorsByTowerId }