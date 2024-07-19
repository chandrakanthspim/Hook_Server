const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { projectValidation } = require('../../validations');
const { projectController } = require('../../controllers');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const { projectUploads } = require('../../utils/constants');
const router = express.Router();



router
  .route('/create-project')
  .post(auth('createProject'), checkUserStatusMiddleware, projectUploads, projectController.createProject);

router
  .route('/projects-statistics')
  .get(auth('getProjectsStatistics'), checkUserStatusMiddleware, projectController.getDashboardStatistics)

router.route('/get-projects').get(auth('getProjectsByBuilderAgent'), checkUserStatusMiddleware, projectController.getProjectsByBuilder);

router
  .route('/:projectId')
  .get(auth('getProjectById'), validate(projectValidation.getProject), checkUserStatusMiddleware, projectController.getProject)
  .patch(auth('updateProject'), checkUserStatusMiddleware, projectUploads, projectController.updateProject)
  .delete(auth('deleteProject'), validate(projectValidation.getProject), checkUserStatusMiddleware, projectController.deleteProject);

router
  .route('/images/:projectId')
  .patch(auth('updateProject'), checkUserStatusMiddleware, projectUploads, projectController.updateProjectImages)

router.route('/:projectId/remove-employee').delete(auth('rmEmpFrProject'), checkUserStatusMiddleware, projectController.removeEmployeeFromProject);

module.exports = router;
