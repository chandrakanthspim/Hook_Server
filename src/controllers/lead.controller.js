const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const SuccessResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const { projectService, builderAgentService, leadService, employeeService } = require('../services');
const { UserCheck, checkUser } = require('../services/admin.service');
const { RoleType } = require('../utils/constants');
const { Lead } = require('../models');
const pick = require('../utils/pick');

const createLeads = catchAsync(async (req, res) => {
    const { builderId, projectId, employeeId, } = req.body;

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder or agent id");
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project id");
    }
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid employee id");
    }

    const findBuilder = await builderAgentService.getBuilderAgentById(builderId);
    if (!findBuilder) {
        throw new ApiError(httpStatus.NOT_FOUND, "builder or agent not found");
    }

    const findProject = await projectService.getProjectById(projectId, builderId);
    if (!findProject) {
        throw new ApiError(httpStatus.NOT_FOUND, 'project is not found');
    }

    const employee = await employeeService.getEmployeeBuilderAgentById(employeeId, builderId);
    if (!employee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    }
    const lead = await leadService.createLead(req.body)
    return new SuccessResponse(httpStatus.CREATED, 'lead captured successfully', lead).send(res);
});

const getLead = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const { leadId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(leadId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid lead id");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder or agent id");
    }
    await UserCheck(userRole, userId)
    const lead = await leadService.getLeadById(leadId)
    if (!lead) {
        throw new ApiError(httpStatus.NOT_FOUND, "lead not found");
    }
    return new SuccessResponse(httpStatus.OK, 'lead retrived successfully', lead).send(res);
})

const getBuilderLeads = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = req.params.userId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder or agent id");
    }

    await checkUser(userRole, userId, actualUserId)
    const filter = pick(req.query, ['sessionId', 'email', 'contactNumber']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const leads = await leadService.getBuilderLeads(actualUserId, filter,options);
    if (!leads) {
        throw new ApiError(httpStatus.NOT_FOUND, "leads are not found under the profile");
    }
    return new SuccessResponse(httpStatus.OK, 'leads are retrived successfully', leads).send(res);
})

const getProjectLeads = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = req.params.userId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId
    const { projectId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder or agent id");
    }

    await checkUser(userRole, userId, actualUserId)
    // const leads = await leadService.getProjectLeads(actualUserId, projectId);
    const filter = pick(req.query, ['sessionId', 'email', 'contactNumber']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const leads = await leadService.getProjectLeads(actualUserId, projectId, filter,options);
    if (!leads) {
        throw new ApiError(httpStatus.NOT_FOUND, "leads are not found under the project");
    }
    return new SuccessResponse(httpStatus.OK, 'leads are retrived successfully', leads).send(res);
})

const getLeadStats = catchAsync(async (req, res) => {
    const { interval } = req.query;
    let startDate;

    switch (interval) {
        case '1week':
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '1month':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '3months':
            startDate = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000);
            break;
        case '6months':
            startDate = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
            break;
        case '1year':
            startDate = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
            break;
        case 'all':
            startDate = new Date(0);
            break;
        default:
            throw new ApiError(httpStatus.NOT_FOUND, 'Invalid interval query specified');
    }

    const leads = await Lead.aggregate([
        {
            $match: {
                capturedAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$capturedAt' } },
                leadsCount: { $sum: 1 }
            }
        },
        {
            $sort: { '_id': 1 }
        },
        {
            $project: {
                date: '$_id',
                leadsCount: 1,
                _id: 0
            }
        }
    ]);

    const data = {
        interval: interval,
        leads: leads
    }
    return new SuccessResponse(httpStatus.OK, 'leads are retrived successfully', data).send(res);

});

const getEmployeeLeads = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = req.params.userId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder or agent id");
    }

    await checkUser(userRole, userId, actualUserId)
    // const leads = await leadService.getEmployeeLeads(userId);
    const filter = pick(req.query, ['sessionId', 'email', 'contactNumber']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const leads = await leadService.getBuilderLeads(userId, filter,options);
    if (!leads) {
        throw new ApiError(httpStatus.NOT_FOUND, "leads are not found under the emploee");
    }
    return new SuccessResponse(httpStatus.OK, 'leads are retrived successfully', leads).send(res);
})

const updateLead = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = req.params.userId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId
    const { leadId } = req.params;
    const updateBody = req.body;

    if (!mongoose.Types.ObjectId.isValid(leadId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid lead id");
    }

    if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder or agent id");
    }
    await checkUser(userRole, userId, actualUserId)
    const lead = await leadService.getLeadById(leadId)
    if (!lead) {
        throw new ApiError(httpStatus.NOT_FOUND, "lead not found");
    }
    const updatedLead = await leadService.updateLead(leadId, updateBody)
    return new SuccessResponse(httpStatus.OK, 'lead updated successfully', updatedLead).send(res);
})

const deleteLead = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = req.params.userId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId
    const { leadId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(leadId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid lead id");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder or agent id");
    }
    await checkUser(userRole, userId, actualUserId)
    const lead = await leadService.getLeadById(leadId)
    if (!lead) {
        throw new ApiError(httpStatus.NOT_FOUND, "lead not found");
    }
    await leadService.deleteLeadById(leadId, actualUserId)
    return new SuccessResponse(httpStatus.OK, 'lead deleted successfully').send(res);
})

const deleteAllLeadsByBuilder = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = req.params.userId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId

    if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder or agent id");
    }
    await checkUser(userRole, userId, actualUserId)
    const lead = await leadService.deleteAllLeadsByBuilderId(actualUserId)
    if (!lead) {
        throw new ApiError(httpStatus.NOT_FOUND, "lead not found");
    }
    return new SuccessResponse(httpStatus.OK, 'leads deleted successfully').send(res);
})

module.exports = { createLeads, getLead, getBuilderLeads, getProjectLeads, getEmployeeLeads, getLeadStats, updateLead, deleteLead, deleteAllLeadsByBuilder }