const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Builder, Employee, Admin } = require('../models');
const { UserStatus } = require('../utils/constants');

const checkUserStatus = async (userId, userType) => {

    try {
        let user;
        switch (userType) {
            case 'admin':
                user = await Admin.findById(userId);
                break;
            case 'builder':
                user = await Builder.findById(userId);
                break;
            case 'agent':
                user = await Builder.findById(userId);
                break;
            case 'employee':
                user = await Employee.findById(userId);
                break;
            default:
                throw new ApiError(httpStatus.FORBIDDEN, 'Invalid user type');
        }

        if (!user) {
            return null;
        }

        if (user.status === UserStatus.INACTIVE) {
            throw new ApiError(httpStatus.FORBIDDEN, 'Your account status is inactive');

        }
        return user.status;
    } catch (error) {
        throw new ApiError(httpStatus.FORBIDDEN, error?.message);
    }
}


async function checkUserStatusMiddleware(req, res, next) {
    const userId = req.user?._id;
    const userType = req.user?.role;
    try {
        const userStatus = await checkUserStatus(userId, userType);
        if (!userStatus) {
            return res.status(403).json({ message: 'User not found or invalid user type' });
        }
        req.user.status = userStatus;
        next();
    } catch (error) {
        return res.status(403).json({ message: error.message });
    }
}


module.exports = { checkUserStatus, checkUserStatusMiddleware };
