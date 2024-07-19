const mongoose = require("mongoose");
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const SuccessResponse = require('../utils/ApiResponse');
const { adminService, planService, builderAgentService } = require("../services");
const { PlanUnit } = require("../utils/constants");

const createPlan = catchAsync(async (req, res) => {
    const adminId = req.user?._id;
    const { name, planType, durationValue, durationUnit, noOfProjects, noOfEmployees, price, discountPercentage, status, monthlyPlanId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }

    const findAdmin = await adminService.getAdminById(adminId);
    if (!findAdmin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found, unable to create plan');
    }

    if (findAdmin) {
        const existingFreePlan = await planService.getFreePlanByAdminId(adminId);
        if (existingFreePlan && existingFreePlan.planType === planType) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Free plan already exists');
        }
    }

    if (durationUnit === PlanUnit.MONTHLY) {
        const monthlyPlanData = {
            name,
            planType,
            duration: {
                value: 30,
                unit: PlanUnit.MONTHLY,
            },
            noOfProjects,
            noOfEmployees,
            price,
            discountPercentage,
            status,
        };
        const monthlyPlan = await planService.createPlan({ createdBy: adminId, ...monthlyPlanData });
        await findAdmin.plans.push(monthlyPlan?.id);
        await findAdmin.save();
        return new SuccessResponse(httpStatus.CREATED, 'Monthly plan created successfully', monthlyPlan).send(res);
    } else if (durationUnit === PlanUnit.YEARLY) {

        if (!mongoose.Types.ObjectId.isValid(monthlyPlanId)) {
            throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid monthly Id");
        }

        const existingYearlyPlan = await planService.getYearlyPlanByMonthlyId(monthlyPlanId);

        if (existingYearlyPlan) {
            throw new ApiError(httpStatus.FORBIDDEN, 'A yearly plan is already created for this monthly plan');
        }

        if (!monthlyPlanId) {
            throw new ApiError(httpStatus.FORBIDDEN, 'Provide a valid monthly Id to create yearly plan');
        }

        if (typeof discountPercentage !== 'number' || discountPercentage < 0 || discountPercentage > 100) {
            throw new ApiError(httpStatus.FORBIDDEN, 'Discount percentage must be a number between 0 and 100');
        }

        if (typeof durationValue !== 'number' || durationValue <= 0) {
            throw new ApiError(httpStatus.FORBIDDEN, 'Duration value must be a positive number');
        }

        const monthlyPlan = await planService.getPlanById(monthlyPlanId);

        if (!monthlyPlan) {
            throw new Error('Monthly plan not found');
        }
        let calculatedPlanPrice;
        const monthlyPrice = monthlyPlan.price;
        const yearlyPrice = monthlyPrice * Math.floor(365 / monthlyPlan.duration.value);
        const discountAmount = yearlyPrice * (discountPercentage / 100);
        calculatedPlanPrice = yearlyPrice - discountAmount;




        const yearlyPlanData = {
            name: monthlyPlan.name,
            planType: monthlyPlan.planType,
            duration: {
                value: 365,
                unit: PlanUnit.YEARLY,
            },
            noOfProjects: monthlyPlan.noOfProjects,
            noOfEmployees: monthlyPlan.noOfEmployees,
            price: calculatedPlanPrice,
            status: monthlyPlan.status,
            discountPercentage,
            durationValue,
            createdBy: adminId,
            monthlyPlanId: monthlyPlanId
        };
        const yearlyPlan = await planService.createPlan(yearlyPlanData);
        await findAdmin.plans.push(yearlyPlan.id);
        await findAdmin.save();
        return new SuccessResponse(httpStatus.CREATED, 'Yearly plan created successfully', yearlyPlan).send(res);
    }
});

const getPlan = catchAsync(async (req, res) => {
    const adminId = req.user?._id
    const { planId } = req.params

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }
    if (!mongoose.Types.ObjectId.isValid(planId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid plan Id");
    }

    const findAdmin = await adminService.getAdminById(adminId);
    if (!findAdmin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found unable to create project');
    }

    const plan = await planService.getPlanById(planId);
    if (!plan) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
    }

    if (findAdmin && plan) {
        return new SuccessResponse(httpStatus.OK, 'Plan retrived successfully', plan).send(res);
    }
});

const getPlans = catchAsync(async (req, res) => {
    const adminId = req.user?._id
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }

    const findAdmin = await adminService.getAdminById(adminId);
    if (!findAdmin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found, unable to create project');
    }

    const filter = pick(req.query, ['name', 'planType', 'status']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const plans = await planService.queryPlans(filter, options);
    return new SuccessResponse(httpStatus.OK, 'Plans retrived successfully', plans).send(res);
});

const updatePlan = catchAsync(async (req, res) => {
    const { planId } = req.params
    const adminId = req.user?._id
    const updateBody = req.body

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }

    const planCheck = await planService.getPlanById(planId);
    if (!planCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
    }

    const findAdmin = await adminService.getAdminById(adminId);
    if (!findAdmin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found, unable to update plan');
    }

    const builderPlanCheck = await builderAgentService.getBuilderAgentPlanCheck(planCheck.id);
    if (builderPlanCheck) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Plan is already used by users and cannot be updated');
    }

    if (findAdmin) {
        const existingFreePlan = await planService.getFreePlanByAdminId(adminId);
        if (updateBody?.planType) {
            if (existingFreePlan && existingFreePlan.planType === updateBody?.planType) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Free plan already exists');
            }
        }
    }

    const plan = await planService.updatePlanById(planId, updateBody);
    return new SuccessResponse(httpStatus.OK, 'Plan updated successfully', plan).send(res);
});

const deletePlan = catchAsync(async (req, res) => {
    const { planId } = req.params;
    const adminId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
    }
    if (!mongoose.Types.ObjectId.isValid(planId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid plan Id");
    }
    const findAdmin = await adminService.getAdminById(adminId);
    if (!findAdmin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found, unable to delete plan');
    }

    const planCheck = await planService.getPlanById(planId);
    if (!planCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
    }

    const builderPlanCheck = await builderAgentService.getBuilderAgentPlanCheck(planCheck.id);
    if (builderPlanCheck) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Plan is already used by users and cannot be deleted');
    }

    const adminUpdate = await adminService.updateAdminById(adminId, {
        $pull: { plans: planId }
    });

    if (!adminUpdate || adminUpdate.nModified === 0) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update admin plans');
    }

    await planService.deletePlanById(planId);
    return new SuccessResponse(httpStatus.OK, 'Plan deleted successfully').send(res);
});

module.exports = { createPlan, getPlan, getPlans, updatePlan, deletePlan }