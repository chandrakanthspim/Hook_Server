const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Admin } = require('../models');
const bcrypt = require('bcryptjs');
const { getBuilderAgentById } = require('../services/builder.service');
const { getEmployeeById } = require('../services/employee.service');

const createAdmin = async (adminBody) => {
    return Admin.create(adminBody);
};

const getAdminById = async (id) => {
    const desiredFields = "fullName email contactNumber gender profilePic plans role";
    const admin = await Admin.findById(id).select(desiredFields).populate('plans', 'planType');
    return admin;
};

const getAdminByEmail = async (email) => {
    const desiredFields = "fullName email contactNumber gender profilePic plans role password";
    const admin = await Admin.findOne({ email }).select(desiredFields);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }
    return admin
};

const updateAdminById = async (adminId, updateBody) => {
    const admin = await getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }
    if (updateBody.$pull && updateBody.$pull.plans) {
        admin.plans.pull(updateBody.$pull.plans);
        delete updateBody.$pull.plans; // Remove the plans field from updateBody to avoid conflicts with other updates
    }

    if (Object.keys(updateBody).length > 0) {
        Object.assign(admin, updateBody);
    }
    await admin.save();
    return admin;
};

const updatePassword = async (adminId, newPassword) => {
    const admin = await getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 8);
    return Admin.findByIdAndUpdate(adminId, { password: hashedPassword }, { new: true });
};

//additional
const checkUser = async (userRole, userId, actualUserId) => {
    switch (userRole) {
        case 'admin':
            const admin = await getAdminById(userId);
            if (!admin) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
            }
            const findBuilder = await getBuilderAgentById(actualUserId);
            if (!findBuilder) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Builder not found');
            }
            break;
        case 'builder':
            const builderCheck = await getBuilderAgentById(actualUserId);
            if (!builderCheck) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Builder not found');
            }
            break;
        case 'agent':
            const agentCheck = await getBuilderAgentById(actualUserId);
            if (!agentCheck) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
            }
            break;
        default:
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user role');
    }
};

const UserCheck = async (userRole, userId) => {
    switch (userRole) {
        case 'admin':
            const admin = await getAdminById(userId);
            if (!admin) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
            }
            break;

        case 'builder':
            const builderCheck = await getBuilderAgentById(userId);
            if (!builderCheck) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Builder not found');
            }
            break;

        case 'agent':
            const agentCheck = await getBuilderAgentById(userId);
            if (!agentCheck) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
            }
            break;
        case 'employee':
            const employeeCheck = await getEmployeeById(userId);
            if (!employeeCheck) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
            }
            break;

        default:
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user role');
    }
};


module.exports = { createAdmin, getAdminById, getAdminByEmail, updateAdminById, updatePassword, checkUser, UserCheck }