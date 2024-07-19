const express = require('express');
const auth = require('../../middlewares/auth');
const buildingController = require('../../controllers/building.controller');
const { buildingUploadMiddleware } = require('../../middlewares/upload');

const router = express.Router();

// router
//   .route('/')
//   .post(auth('manageProject'), uploadPhotosMiddleware, buildingController.createProject)
//   .get(auth('getProjects'), buildingController.getProjects);

// router
//   .route('/:builderId')
//   .get(auth('getBuilding'), buildingController.getBuilding)
//   .post(auth('manageBuilding'), buildingUploadMiddleware, buildingController.createBuilding)
//   // .patch(auth('manageBuilding'), buildingController.updateBuilding)
//   .delete(auth('manageBuilding'), buildingController.deleteBuilding);

router
  .route('/:builderId')
  .get(buildingController.getBuilding)
  .post(buildingUploadMiddleware, buildingController.createBuilding)
  // .patch( buildingController.updateBuilding)
  .delete(buildingController.deleteBuilding);

module.exports = router;
