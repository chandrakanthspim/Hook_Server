const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { employeeController } = require('../../controllers');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const { projectValidation } = require('../../validations');

const router = express.Router();

router
  .route('/employee-details')
  .get(auth('getEmployee'), checkUserStatusMiddleware, employeeController.getEmployee)

  router
  .route('/employee-projects')
  .get(auth('getEmployeeProjects'), checkUserStatusMiddleware, employeeController.getEmployeeProjects)



router
  .route('/employee-details/:employeeId')
  .patch(auth('updateEmployee'), checkUserStatusMiddleware, employeeController.updateEmployee)
  .delete(auth('deleteEmployee'), checkUserStatusMiddleware, employeeController.deleteEmployee)
  .get(auth('getEmployeeByAgentBuilder'), checkUserStatusMiddleware, employeeController.getEmployeeByAgentBuilder)

  router
  .route('/project/:projectId')
  .get(auth('getProjectByEmployee'), validate(projectValidation.getProject), checkUserStatusMiddleware, employeeController.getEmployeeProjectById)

module.exports = router;