const express = require('express');
const auth = require('../../middlewares/auth');
const subscriptionController = require('../../controllers/subscription.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('managesubscription'), subscriptionController.createSubscription)
  .get(auth('managesubscription'), subscriptionController.getSubscriptions);

router
  .route('/:planType')
  .get(auth('managesubscription'), subscriptionController.getSubscription)
  .patch(auth('managesubscription'), subscriptionController.updateSubscription)
  .delete(auth('managesubscription'), subscriptionController.deleteSubscription);

module.exports = router;
