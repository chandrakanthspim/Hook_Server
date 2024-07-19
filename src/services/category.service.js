const httpStatus = require('http-status');
const { Category } = require('../models');
const ApiError = require('../utils/ApiError');

const createCategoryName = async ({ name }) => {
    const categoryCheck = await Category.findOne({ name });
    if (categoryCheck) {
        throw new ApiError(httpStatus.BAD_REQUEST, "category already exists");
    }
    return Category.create({ name });
};

const getCategories = async () => {
    const category = await Category.find({}).populate('states', 'state')
    return category;
};

const getCategoryById = async (id) => {
    const category = await Category.findById(id)
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, "category not found");
    }
    return category;
};

const updateCategoryId = async ({ categoryId, updateBody }) => {
    const category = await getCategoryById(categoryId);
    const categoryName = category.name
    const categoryCheck = await Category.findOne({ categoryName });
    if (categoryCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, "category already exists, unable to update");
    }
    Object.assign(category, updateBody);
    await category.save();
    return category;
};

const deleteCategoryById = async (categoryId) => {
    const category = await getCategoryById(categoryId);
    await category.remove();
    return category;
};

module.exports = { createCategoryName, getCategories, getCategoryById, updateCategoryId, deleteCategoryById }