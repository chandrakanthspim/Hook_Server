const { Plan } = require('../models');
const { PlanUnit, PlanType } = require('../utils/constants');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const createPlan = async (planBody) => {
  return Plan.create(planBody);
};

const getPlanById = async (id) => {
  const desiredFields = 'name planType price noOfProjects noOfEmployees duration status userCount createdAt updatedAt';
  return Plan.findById(id).select(desiredFields).populate('createdBy', 'fullName email contactNumber');
};

const getFreePlanByAdminId = async (adminId) => {
  const freePlan = await Plan.findOne({ createdBy: adminId, planType: PlanType.FREE });
  return freePlan;
};

const getMonthlyPlanByAdminIdAndType = async (adminId, planType) => {
  const monthlyPlan = await Plan.findOne({
    createdBy: adminId,
    'duration.unit': PlanUnit.MONTHLY,
    planType: planType,
  });
  return monthlyPlan;
};

const getYearlyPlanByMonthlyId = async (monthlyPlanId) => {
  const monthlyPlan = await Plan.findOne({
    monthlyPlanId,
    'duration.unit': PlanUnit.YEARLY,
  });
  return monthlyPlan;
};

const getYearlyPlanByAdminIdAndType = async (adminId, planType) => {
  const yearlyPlan = await Plan.findOne({
    createdBy: adminId,
    'duration.unit': PlanUnit.YEARLY,
    planType: planType,
  });
  return yearlyPlan;
};

const queryPlans = async (filter, options) => {
  const plans = await Plan.paginate(filter, options);
  return plans;
};

const updatePlanById = async (planId, updateBody) => {
  const updateData = updateBody;
  const plan = await getPlanById(planId);
  if ('userCount' in updateBody) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Plan count is not able to update');
  }
  Object.assign(plan, updateData);
  await plan.save();
  return plan;
};

const deletePlanById = async (planId) => {
  const plan = await getPlanById(planId);
  await plan.remove();
  return plan;
};

module.exports = {
  createPlan,
  getPlanById,
  queryPlans,
  updatePlanById,
  deletePlanById,
  getFreePlanByAdminId,
  getMonthlyPlanByAdminIdAndType,
  getYearlyPlanByAdminIdAndType,
  getYearlyPlanByMonthlyId,
};
