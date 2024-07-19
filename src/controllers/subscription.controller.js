const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { subscriptionService } = require('../services');

const createSubscription = catchAsync(async (req, res) => {
  // console.log(req.body);
  const plan = await subscriptionService.createSubscription(req.body);
  res.status(httpStatus.CREATED).send(plan);
});

const getSubscriptions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await subscriptionService.querySubscriptions(filter, options);
  res.send(result);
});

const getSubscription = catchAsync(async (req, res) => {
  const plan = await subscriptionService.getSubscriptionByPlanType(req.params.planType);
  if (!plan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscription not found');
  }
  res.send(plan);
});

const updateSubscription = catchAsync(async (req, res) => {
  const plan = await subscriptionService.updateSubscriptionByPlanType(req.params.planType, req.body);
  res.send(plan);
});

const deleteSubscription = catchAsync(async (req, res) => {
  await subscriptionService.deleteSubscriptionByPlanType(req.params.planType);
  res.status(httpStatus.NO_CONTENT).send();
});

const deleteMultipleSubscriptions = catchAsync(async (req, res) => {
  let planDeleteArray = [];
  req.body.forEach(function (plan) {
    //req.body => [{'_id' : ".." , "name" : "plan1"}]
    planDeleteArray.push(new ObjectID(plan._id));
  });

  await subscriptionService.deleteSubscriptionByPlanType(planDeleteArray);
  res.status(httpStatus.NO_CONTENT).send();
});
module.exports = {
  createSubscription,
  getSubscriptions,
  getSubscription,
  updateSubscription,
  deleteSubscription,
  deleteMultipleSubscriptions,
};
