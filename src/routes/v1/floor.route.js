const express = require('express');
const auth = require('../../middlewares/auth');
const { floorController } = require('../../controllers');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const { apartmentUploads } = require('../../utils/constants');
const router = express.Router();

//floor
router
  .route('/floor/:towerId')
  .post(auth('createFloor'), checkUserStatusMiddleware, apartmentUploads, floorController.createFloor)

router
  .route('/floor/:floorId')
  .get(floorController.getFloor)
  .patch(auth('updateFloor'), checkUserStatusMiddleware, apartmentUploads, floorController.updateFloor)
  .delete(auth('deleteFloor'), checkUserStatusMiddleware, apartmentUploads, floorController.deleteFloor)

router
  .route('/floor/get-floors/:towerId')
  .get(floorController.getFloors)

module.exports = router


