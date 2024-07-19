const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { PlanStatus, PlanType, PlanUnit } = require('../utils/constants');


const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    planType: {
        type: String,
        enum: [PlanType.FREE, PlanType.SILVER, PlanType.GOLD, PlanType.DIAMOND],
        required: [true, 'please select the plan']
    },
    duration: {
        value: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            enum: [PlanUnit.MONTHLY, PlanUnit.YEARLY],
            required: true
        }
    },
    price: {
        type: Number,
        required: [true, 'please enter plan price'],
    },
    noOfProjects: {
        type: Number,
        required: [true, 'please enter no of projects']
    },
    noOfEmployees: {
        type: Number,
        required: [true, 'please enter plan no of employees']
    },
    status: {
        type: String,
        enum: [PlanStatus.ACTIVE, PlanStatus.INACTIVE, PlanStatus.ON_HOLD],
        required: [true, 'please select plan status'],
        default: PlanStatus.ACTIVE
    },
    discountPercentage: {
        type: Number,
        required: true,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
    },
    monthlyPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan'
    },
    isvisibleToUsers: {
        type: Boolean,
        default: false,
      },
    userCount: {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true
    });

planSchema.plugin(toJSON);
planSchema.plugin(paginate);

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
