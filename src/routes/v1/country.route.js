const express = require('express');
const auth = require('../../middlewares/auth');
const { countryController } = require('../../controllers');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const router = express.Router();



router
    .route('/country/create-country')
    .post(auth('createCountry'), checkUserStatusMiddleware, countryController.createCountry)

router.route('/country/get-countries').get(auth('getCountries'), checkUserStatusMiddleware, countryController.getCountries);

router
    .route('/country/:countryId')
    .get(auth('getCountry'), checkUserStatusMiddleware, countryController.getCountry)
    .patch(auth('updateCountry'), checkUserStatusMiddleware, countryController.updateCountry)
    .delete(auth('deleteCountry'), checkUserStatusMiddleware, countryController.deleteCountry);

module.exports = router;