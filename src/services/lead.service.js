const { Lead, Employee, Project } = require("../models")
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const createLead = async (leadBody) => {
    const lead = await Lead.create(leadBody)
    return lead;
}

const getLeadById = async (id) => {
    const lead = await Lead.findById(id)
    return lead;
}

const getBuilderLeads = async (builderId, filter, options) => {
    const query = { builderId, ...filter };
    const leads = await Lead.paginate(query, options);
    return leads;
};


const getEmployeeLeads = async (employeeId, filter, options) => {
    // const leads = await Lead.find({ employeeId })
    const query = { employeeId, ...filter };
    const leads = await Lead.paginate(query, options);
    return leads;
}

const getProjectLeads = async (builderId, projectId, filter, options) => {
    // const leads = await Lead.find({ builderId, projectId })
    const query = { builderId, projectId, ...filter };
    const leads = await Lead.paginate(query, options);
    return leads;
}

const getLeads = async (filter, options) => {
    const leads = await Lead.paginate(filter, options)
    return leads;
}

const updateLead = async (leadId, updateBody) => {
    const lead = await getLeadById(leadId);
    if (!lead) {
        throw new ApiError(httpStatus.NOT_FOUND, 'lead not found');
    }

    // (!('status' in updateBody) || Object.keys(updateBody).length !== 1)
    // if (!allowedFields.includes(updateKeys[0])) {
    //     throw new ApiError(httpStatus.BAD_REQUEST, 'only the status field can be updated');
    // }

    const allowedFields = ['status'];
    const updateKeys = Object.keys(updateBody);
    const invalidFields = updateKeys.filter(key => !allowedFields.includes(key));
    // console.log(updateKeys,invalidFields)
    if (invalidFields.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'only the status field can be updated');
    }

    if ('status' in updateBody) {
        lead.status = updateBody.status;
    }
    await lead.save();
    return lead;
};

const deleteLeadById = async (leadId, builderId) => {
    const lead = await getLeadById(leadId, builderId);
    await lead.remove();
    return lead;
};

const deleteAllLeadsByBuilderId = async (builderId) => {
    const leads = await Lead.find({ builderId });
    if (!leads || leads.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No leads found for this builder');
    }
    await Lead.deleteMany({ builderId });
    return leads;
}

module.exports = { createLead, getLeadById, getBuilderLeads, getEmployeeLeads, getProjectLeads, getLeads, updateLead, deleteLeadById, deleteAllLeadsByBuilderId }