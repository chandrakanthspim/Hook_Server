const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { adminController, builderController, employeeController, projectController, authController, plottingController, apartmentController, towerController, floorController, flatController } = require('../../controllers');
const { builderValidation, authValidation } = require('../../validations');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const { projectUploads, plottingUploads, apartmentUploads } = require('../../utils/constants');
const router = express.Router();

router
  .route('/admin-details')
  .get(auth('getAdmin'), adminController.getAdmin)
  .patch(auth('updateAdmin'), adminController.updateAdmin)

//builders & agents
router
  .route('/builders')
  .get(auth('getBuilders'), validate(builderValidation.getBuilders), builderController.getBuilders);

//upgrade builder plan
router
  .route('/builder/:userId/upgrade-plan')
  .patch(auth("upgradeBuilderPlan"),builderController.upgradePlan)

//builder by id
router
  .route('/builder-details/:userId')
  .get(auth('getBuilderAgentById'), adminController.getBuilderAgent)
  .patch(auth('updateBuilder'), checkUserStatusMiddleware, builderController.updateBuilder);

router
  .route('/agents')
  .get(auth('getAgents'), validate(builderValidation.getBuilders), builderController.getAgents);

router.route('/delete-builder/:userId')
  .delete(auth('deleteBuilder'), validate(builderValidation.deleteBuilder), builderController.deleteBuilder);

router.route('/delete-agent/:userId')
  .delete(auth('deleteAgent'), validate(builderValidation.deleteBuilder), builderController.deleteAgent);

//create project
router
  .route('/create-project/:userId')
  .post(auth('createProject'), checkUserStatusMiddleware, projectUploads, projectController.createProject)

router
  .route('/project-details/:projectId')
  .get(auth('getProjectById'), adminController.getProject);

router.route('/builder/:userId/project/:projectId/remove-employee').delete(auth('rmEmpFrProject'), checkUserStatusMiddleware, projectController.removeEmployeeFromProject);

//update project
router
  .route('/builder/:userId/project/:projectId')
  .patch(auth('updateProject'), checkUserStatusMiddleware, projectUploads, projectController.updateProject)

  //delete project
  .delete(auth('deleteProject'), checkUserStatusMiddleware, projectController.deleteProject)

//update project images
router
  .route('/builder/:userId/project/images/:projectId')
  .patch(auth('updateProject'), checkUserStatusMiddleware, projectUploads, projectController.updateProjectImages)

//create employee
router.post('/:userId/create-employee', auth('createEmployee'), validate(authValidation.employeeRegister), authController.employeeRegister);
router
  .route('/:userId/employee-details/:employeeId')
  .patch(auth('updateEmployee'), checkUserStatusMiddleware, employeeController.updateEmployee)
  .delete(auth('deleteEmployee'), checkUserStatusMiddleware, employeeController.deleteEmployee)

//employee
router
  .route('/employee-details/:employeeId')
  .get(auth('getEmployeeById'), adminController.getEmployee);

//employees
router
  .route('/employees')
  .get(auth('getEmployees'), employeeController.getEmployees);


//all projects
router
  .route('/projects')
  .get(auth('getProjects'), projectController.getProjects);

//plot
router
  .route('/availibility/plot/:projectId')
  .post(auth("createPlotting"), plottingUploads, plottingController.createPlotting)
  .patch(auth("updatePlotting"), plottingUploads, plottingController.updatePlotting)
  .delete(auth("deletePlotting"), plottingController.deletePlotting)

router
  .route('/availibility/plot/get-plots')
  .get(auth('getAllPlotting'), plottingController.getAllPlotting)

  router
  .route('/availibility/plot/:projectId')
  .get(auth('getPlotting'), plottingController.getPlotting)

//apartment
router
  .route('/availibility/apartment/:projectId')
  .post(auth('createApartment'), checkUserStatusMiddleware, apartmentUploads, apartmentController.createApartment)
  .patch(auth('updateApartment'), checkUserStatusMiddleware, apartmentUploads, apartmentController.updateApartment)
  .delete(auth("deleteApartment"), checkUserStatusMiddleware, apartmentController.deleteApartment)

router
  .route('/availibility/apartment/get-apartments')
  .get(auth('getAllApartments'), checkUserStatusMiddleware, apartmentController.getAllApartments)

router
  .route('/availibility/apartment/get-statistics/:projectId')
  .get(auth('getApartmentsStatistics'), checkUserStatusMiddleware, apartmentController.getDashboardStatistics)

router
  .route('/availibility/apartment/:projectId')
  .get(apartmentController.getApartment)

//tower
router
  .route('/availibility/tower/:apartmentId')
  .post(auth('createTower'), checkUserStatusMiddleware, apartmentUploads, towerController.createTower)

router
  .route('/availibility/tower/:towerId')
  .patch(auth('updateTower'), checkUserStatusMiddleware, apartmentUploads, towerController.updateTower)
  .delete(auth('deleteTower'), checkUserStatusMiddleware, apartmentUploads, towerController.deleteTower)
router
  .route('/availibility/tower/:towerId')
  .get(towerController.getTower)

router
  .route('/availibility/tower/get-towers/:apartmentId')
  .get(towerController.getTowers)

//floor
router
  .route('/availibility/floor/:towerId')
  .post(auth('createFloor'), checkUserStatusMiddleware, apartmentUploads, floorController.createFloor)

router
  .route('/availibility/floor/:floorId')
  .get(floorController.getFloor)
  .patch(auth('updateFloor'), checkUserStatusMiddleware, apartmentUploads, floorController.updateFloor)
  .delete(auth('deleteFloor'), checkUserStatusMiddleware, apartmentUploads, floorController.deleteFloor)

router
  .route('/availibility/floor/get-floors/:towerId')
  .get(floorController.getFloors)

//flat
router
  .route('/availibility/flat/:floorId')
  .post(auth('createFlat'), checkUserStatusMiddleware, apartmentUploads, flatController.createFlat)

router
  .route('/availibility/flat/:flatId')
  .get(flatController.getFlat)
  .patch(auth('updateFlat'), checkUserStatusMiddleware, apartmentUploads, flatController.updateFlat)
  .delete(auth('deleteFlat'), checkUserStatusMiddleware, apartmentUploads, flatController.deleteFlat)

router
  .route('/availibility/availibility/flat/get-flats/:floorId')
  .get(flatController.getFlats)


module.exports = router;