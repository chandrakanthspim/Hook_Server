const mongoose = require('mongoose');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { categoryService, adminService, builderAgentService } = require('../services');
const SuccessResponse = require('../utils/ApiResponse');

const createCategory = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { name } = req.body

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid user Id");
    }
    const admin = await adminService.getAdminById(userId);
    const builder = await builderAgentService.getBuilderAgentById(userId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }
    if (!builder) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Builder not found');
    }
    const createdCategory = await categoryService.createCategoryName({ name });
    return new SuccessResponse(httpStatus.CREATED, 'project category created successfully', createdCategory).send(res);
});

const getCategory = catchAsync(async (req, res) => {
    const userId = req.user?._id;
    const categoryId = req.params.categoryId

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid category Id");
    }

    const [admin, builder] = await Promise.all([
        adminService.getAdminById(userId).catch(() => null),
        builderAgentService.getBuilderAgentById(userId).catch(() => null) //return null if not found
    ]);

    if (!admin && !builder) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const category = await categoryService.getCategoryById(categoryId);
    return new SuccessResponse(httpStatus.OK, "category retrived successfully", category).send(res);
});

const getCategories = catchAsync(async (req, res) => {
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid user Id");
    }

    const [admin, builder] = await Promise.all([
        adminService.getAdminById(userId).catch(() => null),
        builderAgentService.getBuilderAgentById(userId).catch(() => null) //return null if not found
    ]);

    if (!admin && !builder) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const category = await categoryService.getCategories();
    return new SuccessResponse(httpStatus.OK, "categories retrived successfully", category).send(res);
});

const updateCategory = catchAsync(async (req, res) => {
    const categoryId = req.params.categoryId;
    const updateBody = req.body;
    const adminId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }

    const admin = await adminService.getAdminById(adminId);

    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }
    const categoryCheck = await categoryService.getCategoryById(categoryId);
    if (!categoryCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }

    const category = await categoryService.updateCategoryId({ categoryId, updateBody });
    return new SuccessResponse(httpStatus.OK, 'category updated successfully', category).send(res);
});

const deleteCategory = catchAsync(async (req, res) => {
    const adminId = req.user?._id;
    const categoryId = req.params.categoryId

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "provide a valid admin Id");
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "provide a valid category Id");
    }
    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }
    const categoryCheck = await categoryService.getCategoryById(categoryId);
    if (!categoryCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }

    await categoryService.deleteCategoryById(categoryId);
    return new SuccessResponse(httpStatus.OK, "category deleted successfully").send(res);
});

module.exports = { createCategory, getCategory, getCategories, updateCategory, deleteCategory }