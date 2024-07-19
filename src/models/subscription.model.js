const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const subscriptionSchema = mongoose.Schema(
  {
    planType: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    virtualTour: {
      type: Number,
      required: true,
    },
    numberOfUsers: {
      type: Number,
      required: true,
    },
    planValidity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.plugin(toJSON);
subscriptionSchema.plugin(paginate);

/**
 * @typedef Subscription
 */
const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
