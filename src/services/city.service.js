const httpStatus = require('http-status');
const { City } = require('../models');
const ApiError = require('../utils/ApiError');

const createCityName = async ({ name,stateId }) => {
    const cityCheck = await City.findOne({ name });
    if (cityCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, "city already exists");
    }
    return City.create({ name,state:stateId });
};

const getCities = async () => {
    const city = await City.find({}).populate('state','name')
    return city;
};

const getCityById = async (id) => {
    const city = await City.findById(id).populate('state','name')
    if (!city) {
        throw new ApiError(httpStatus.NOT_FOUND, "city not found");
    }
    return city;
};

const updateCityId = async ({ cityId, updateBody }) => {
    const city = await getCityById(cityId);
    const name = city.name
    const cityCheck = await City.findOne({ name });
    if (cityCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, "city already exists, unable to update");
    }
    Object.assign(city, updateBody);
    await city.save();
    return city;
};

const deleteCityById = async (cityId) => {
    const city = await getCityById(cityId);
    await city.remove();
    return city;
};

module.exports = { createCityName, getCities, getCityById, updateCityId, deleteCityById }