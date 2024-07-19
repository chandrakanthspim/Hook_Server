const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { buildingService } = require('../services');

const createBuilding = catchAsync(async (req, res) => {
  // console.log(req.body);
  const builderId = req.params.builderId;
  const projectId = req.query.projectId;
  const metadata = req.body.metadata;
  const files = req.files;
  const building = await buildingService.createBuilding({ files, projectId, builderId, metadata });
  res.send(building);
  // res.status(httpStatus.CREATED).send({ projectId, builderId, metadata });
});

const getBuilding = catchAsync(async (req, res) => {
  const builderId = req.params.builderId;
  const projectId = req.query.projectId;
  const result = await buildingService.getBuilding({ projectId, builderId });
  res.send(result);
});

// const getSubscription = catchAsync(async (req, res) => {
//   const plan = await subscriptionService.getSubscriptionByPlanType(req.params.planType);
//   if (!plan) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'Subscription not found');
//   }
//   res.send(plan);
// });

// const updateSubscription = catchAsync(async (req, res) => {
//   const plan = await subscriptionService.updateSubscriptionByPlanType(req.params.planType, req.body);
//   res.send(plan);
// });

const deleteBuilding = catchAsync(async (req, res) => {
  await buildingService.deleteBuilding({ projectId, builderId });
  res.status(httpStatus.NO_CONTENT).send();
});

// const deleteMultipleSubscriptions = catchAsync(async (req, res) => {
//   let planDeleteArray = [];
//   req.body.forEach(function (plan) {
//     //req.body => [{'_id' : ".." , "name" : "plan1"}]
//     planDeleteArray.push(new ObjectID(plan._id));
//   });

//   await subscriptionService.deleteSubscriptionByPlanType(planDeleteArray);
//   res.status(httpStatus.NO_CONTENT).send();
// });
module.exports = {
  createBuilding,
  //   getBuildings,
  getBuilding,
  //   updateBuilding,
  deleteBuilding,
  //   deleteMultipleBuildings,
};
