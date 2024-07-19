const express = require('express');
const auth = require('../../middlewares/auth');
const { flatController } = require('../../controllers');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const { apartmentUploads } = require('../../utils/constants');
const router = express.Router();

//flat
router
  .route('/flat/:floorId')
  .post(auth('createFlat'), checkUserStatusMiddleware, apartmentUploads, flatController.createFlat)

router
  .route('/flat/:flatId')
  .get(flatController.getFlat)
  .patch(auth('updateFlat'), checkUserStatusMiddleware, apartmentUploads, flatController.updateFlat)
  .delete(auth('deleteFlat'), checkUserStatusMiddleware, apartmentUploads, flatController.deleteFlat)

router
  .route('/flat/get-flats/:floorId')
  .get(flatController.getFlats)

module.exports = router;
