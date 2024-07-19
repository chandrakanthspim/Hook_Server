const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { builderController, employeeController } = require('../../controllers');
const { builderValidation } = require('../../validations');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');

const router = express.Router();

router
  .route('/agent-details')
  .get(auth('getAgent'), builderController.getBuilderAgent)
  .patch(auth('updateAgent'), builderController.updateBuilder,checkUserStatusMiddleware)

  router
  .route('/get-employees')
  .get(auth('getAgentEmployees'), employeeController.getEmployeesByBuilderAgent)

module.exports = router;