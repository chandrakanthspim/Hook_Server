const express = require('express');
const auth = require('../../middlewares/auth');
const { apartmentController } = require('../../controllers');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const { apartmentUploads } = require('../../utils/constants');


const router = express.Router();

//apartment
router
  .route('/apartment/:projectId')
  .post(auth('createApartment'), checkUserStatusMiddleware, apartmentUploads, apartmentController.createApartment)
  .patch(auth('updateApartment'), checkUserStatusMiddleware, apartmentUploads, apartmentController.updateApartment)
  .delete(auth("deleteApartment"), checkUserStatusMiddleware, apartmentController.deleteApartment)

  router
  .route('/apartment/builder-apartments')
  .get(auth('getBuilderApartments'), checkUserStatusMiddleware, apartmentController.getBuilderApartments)

  router
  .route('/apartment/get-statistics/:projectId')
  .get(auth('getApartmentStatistics'), checkUserStatusMiddleware, apartmentController.getDashboardStatistics)

router
  .route('/apartment/:projectId')
  .get(apartmentController.getApartment)
  
  router
  .route('/apartment/overall-apartment/:projectId')
  .get(apartmentController.getOverallApartment)

module.exports = router