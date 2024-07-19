const express = require('express');
const validate = require('../../middlewares/validate');
const { authController } = require('../../controllers');
const { authValidation } = require('../../validations');
const auth = require('../../middlewares/auth');
const router = express.Router();

//admin auth
router.post('/admin/signup', validate(authValidation.adminRegister), authController.adminRegister);
router.post('/admin/signin', validate(authValidation.login), authController.adminLogin);
router.post('/admin/signout', validate(authValidation.logout), authController.logout);
router.post('/admin/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/admin/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/admin/reset-password', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/builder/send-verification-email', authController.sendVerificationEmail);
router.post('/builder/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.post('/admin/update-password',auth('adminUpdatePassword'), authController.updatePassword);

module.exports = router;