const express = require('express');
const auth = require('../../middlewares/auth');
const { stateController } = require('../../controllers');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const router = express.Router();



router
    .route('/state/create-state/:countryId')
    .post(auth('createState'), checkUserStatusMiddleware, stateController.createState)

router.route('/state/get-states').get(auth('getStates'), stateController.getStates);

router
    .route('/state/:stateId')
    .get(auth('getState'), checkUserStatusMiddleware, stateController.getState)
    .patch(auth('updateState'), checkUserStatusMiddleware, stateController.updateState)
    .delete(auth('deleteState'), checkUserStatusMiddleware, stateController.deleteState);

module.exports = router;