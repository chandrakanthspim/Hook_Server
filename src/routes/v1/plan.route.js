const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { planController } = require('../../controllers');
const { planValidation } = require('../../validations');

const router = express.Router();


router
  .route('/plan/create-plan')
  .post(auth('createPlan'), planController.createPlan);

  router
  .route('/plan/plan-details/:planId')
  .get(auth('getPlan'),validate(planValidation.getPlan), planController.getPlan)
  .patch(auth('updatePlan'),planController.updatePlan)
  .delete(auth('deletePlan'),validate(planValidation.getPlan), planController.deletePlan)

  router
  .route('/plan/get-plans')
  .get(auth('getPlans'), planController.getPlans)

module.exports = router;