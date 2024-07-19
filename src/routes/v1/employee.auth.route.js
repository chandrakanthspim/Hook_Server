const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { authController } = require('../../controllers');
const { authValidation } = require('../../validations');

const router = express.Router();

//employee auth
router.post('/employee/signup',auth('createEmployee'), validate(authValidation.employeeRegister), authController.employeeRegister);
router.post('/employee/signin', validate(authValidation.login), authController.employeeLogin);
router.post('/employee/signout', validate(authValidation.logout), authController.logout);
router.post('/employee/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/employee/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/employee/reset-password', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/employee/send-verification-email', authController.sendVerificationEmail);
router.post('/employee/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.patch('/employee/update-password',auth("employeeUpdatePassword"), authController.updatePassword);
router.patch('/employee/update-password/:employeeId',auth("employeeUpdatePassword"), authController.updateEmployeePasswordByBuilder);


module.exports = router;