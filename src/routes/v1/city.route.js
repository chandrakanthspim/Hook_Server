const express = require('express');
const auth = require('../../middlewares/auth');
const { cityController } = require('../../controllers');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const router = express.Router();



router
    .route('/city/create-city/:stateId')
    .post(auth('createCity'), checkUserStatusMiddleware, cityController.createCity)

router.route('/city/get-cities').get(auth('getCities'), checkUserStatusMiddleware, cityController.getCities);

router
    .route('/city/:cityId')
    .get(auth('getCity'), checkUserStatusMiddleware, cityController.getCity)
    .patch(auth('updateCity'), checkUserStatusMiddleware, cityController.updateCity)
    .delete(auth('deleteCity'), checkUserStatusMiddleware, cityController.deleteCity);

module.exports = router;