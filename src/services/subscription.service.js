const httpStatus = require('http-status');
const { Subscription } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a subscription
 * @param {Object} subscriptionBody
 * @returns {Promise<Subscription>}
 */
const createSubscription = async (subscriptionBody) => {
  // console.log('in subscription service', subscriptionBody);
  return Subscription.create(subscriptionBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const querySubscriptions = async (filter, options) => {
  const subscriptions = await Subscription.paginate(filter, options);
  return subscriptions;
};

/**
 * Get subscription by id
 * @param {ObjectId} id
 * @returns {Promise<Subscription>}
 */
const getSubscriptionByPlanType = async (planType) => {
  return Subscription.findOne({ planType });
};

/**
 * Update subscription by plantype
 * @param {ObjectId} planType
 * @param {Object} updateBody
 * @returns {Promise<Subscription>}
 */
const updateSubscriptionByPlanType = async (planType, updateBody) => {
  const subscription = await getSubscriptionByPlanType(planType);
  if (!subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscription not found');
  }
  Object.assign(subscription, updateBody);
  // console.log(subscription);
  await subscription.save();
  return subscription;
};

/**
 * Delete subscription by planType
 * @param {ObjectId} planType
 * @returns {Promise<Subscription>}
 */
const deleteSubscriptionByPlanType = async (planType) => {
  const subscription = await getSubscriptionByPlanType(planType);
  if (!subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscription not found');
  }
  await subscription.remove();
  return subscription;
};

const deleteMultipleSubscriptionsByPlanType = async (subscriptionIdArray) => {
  await Subscription.remove({ _id: { $in: subscriptionIdArray } });

  return null;
};

module.exports = {
  createSubscription,
  querySubscriptions,
  getSubscriptionByPlanType,
  updateSubscriptionByPlanType,
  deleteSubscriptionByPlanType,
  deleteMultipleSubscriptionsByPlanType,
};
