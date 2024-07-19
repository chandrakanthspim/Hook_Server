const { Tower } = require("../models");
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError')

const createTower = async (towerBody) => {
    const tower = await Tower.create(towerBody)
    return tower
};

const getTowersByApartmentId = async (apartmentId) => {
    const tower = await Tower.find({ apartmentId: apartmentId })
    return tower;
};

const getTower = async (towerId) => {
    const tower = await Tower.findById(towerId)
    return tower;
};

const updateTower = async (towerId, updateBody) => {
    const tower = await getTower(towerId);
    if (!tower) {
        throw new ApiError(httpStatus.NOT_FOUND, 'tower not found');
    }

    if (updateBody.$pull && updateBody.$pull.floors) {
        tower.floors.pull(updateBody.$pull.floors);
        delete updateBody.$pull.floors;
    }

    // Update tower fields
    Object.keys(updateBody).forEach(key => {
        tower[key] = updateBody[key];
    });
    await tower.save();
    return tower;
};

const deleteTowersByApartmentId = async (apartmentId) => {
    const towers = await Tower.find({ apartmentId });
    return await Tower.deleteMany({ apartmentId });
};

const deleteTower = async (towerId) => {
        const tower = await getTower(towerId);
        await tower.remove();
};

module.exports = { createTower, getTowersByApartmentId, getTower, updateTower, deleteTower, deleteTowersByApartmentId }