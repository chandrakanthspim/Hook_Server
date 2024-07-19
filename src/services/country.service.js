const httpStatus = require('http-status');
const { Country } = require('../models');
const ApiError = require('../utils/ApiError');

const createCountryName = async ({ name }) => {
    const countryCheck = await Country.findOne({ name });
    if (countryCheck) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Country already exists");
    }
    return Country.create({ name });
};

const getCountries = async () => {
    const country = await Country.find({}).populate('states','name')
    return country;
};

const getCountryById = async (id) => {
    const country = await Country.findById(id).populate('states','name')
    if (!country) {
        throw new ApiError(httpStatus.NOT_FOUND, "country not found");
    }
    return country;
};

const updateCountryId = async ({ countryId, updateBody }) => {
    const country = await getCountryById(countryId);
    const countryName = country.name
    const countryCheck = await Country.findOne({ countryName });
    if (countryCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, "country already exists, unable to update");
    }
    Object.assign(country, updateBody);
    await country.save();
    return country;
};

const deleteCountryById = async (countryId) => {
    const country = await getCountryById(countryId);
    await country.remove();
    return country;
};

module.exports = { createCountryName, getCountries, getCountryById, updateCountryId, deleteCountryById }