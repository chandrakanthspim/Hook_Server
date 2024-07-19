const express = require('express');
const validate = require('../../middlewares/validate');
const { authController } = require('../../controllers');
const { authValidation } = require('../../validations');
const auth = require('../../middlewares/auth');

const router = express.Router();

//builder auth
router.post('/agent/signup', auth('createBuilder'), validate(authValidation.builderRegister), authController.builderAgentRegister);
router.post('/agent/signin', validate(authValidation.login), authController.builderAgentLogin);
router.post('/agent/signout', validate(authValidation.logout), authController.logout);
router.post('/agent/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/agent/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/agent/reset-password', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/agent/send-verification-email', authController.sendVerificationEmail);
router.post('/agent/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.patch('/agent/update-password', auth("agentUpdatePassword"), authController.updatePassword);
router.patch('/agent/update-password/:builderId',auth("updateBuilderPasswordByAdmin"), authController.updateBuilderPasswordByAdmin);

module.exports = router;