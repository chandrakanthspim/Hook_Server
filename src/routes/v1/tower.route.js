const express = require('express');
const auth = require('../../middlewares/auth');
const { towerController } = require('../../controllers');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const { apartmentUploads } = require('../../utils/constants');
const router = express.Router();

//tower
router
  .route('/tower/:apartmentId')
  .post(auth('createTower'), checkUserStatusMiddleware, apartmentUploads, towerController.createTower)

router
  .route('/tower/:towerId')
  .patch(auth('updateTower'), checkUserStatusMiddleware, apartmentUploads, towerController.updateTower)
  .delete(auth('deleteTower'), checkUserStatusMiddleware, apartmentUploads, towerController.deleteTower)

router
  .route('/tower/get-towers/:apartmentId')
  .get(towerController.getTowers)


router
  .route('/tower/:towerId')
  .get(towerController.getTower)

module.exports = router