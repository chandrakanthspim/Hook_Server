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
  .delete(auth("deleteApartment"), checkUserStatusMiddleware, apartmentController.deleteApartment)

router
  .route('/apartment/:builderId')
  .get(apartmentController.getApartment)

module.exports = router