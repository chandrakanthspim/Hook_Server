const { Leads, User, Project } = require('../models');
const { isValidDate } = require('../utils/utils');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const getLead = async (req, res, next) => {
  const { leadId } = req.params;
  const leadDoc = await Leads.findById(leadId).populate('client').populate('allocatedTo').populate('property').exec();

  if (!leadDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leads not found');
  }
  return leadDoc;
};

const getLeadBySessionId=async(sessionID)=>{
  return Leads.findOne({sessionID})
}

const getLeads = async (req, res, next) => {
  const allLeads = await Leads.find().populate('client').populate('allocatedTo').populate('property').exec();
  return allLeads;
};

const getLeadByPhone = async (phone) => {
  const user = await User.findOne({ contactNumber :phone  });
  const leadDoc = await Leads.find({ client: user?._id })
    .populate('client')
    .populate('allocatedTo')
    .populate('property')
    .exec();

  if (!leadDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Couldn't find Leads by phone");
  }

  return leadDoc;
};

const getEmployeeLeads = async (req, res, next) => {
  const leadDoc = await Leads.find({ allocatedTo: req.user?._id, isArchived: false })
    .populate('property')
    .populate('client')
    .populate('allocatedTo')
    .exec();
  if (!leadDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Couldn't find Leads ");
  }

  return leadDoc;
};

const priorities = [
  { name: 'Very Hot', value: 'veryHot' },
  { name: 'Hot', value: 'hot' },
  { name: 'Moderate', value: 'moderate' },
  { name: 'Cold', value: 'cold' },
  { name: 'Very Cold', value: 'veryCold' },
];
const sources = [
  { name: 'Instagram', value: 'instagram' },
  { name: 'Facebook', value: 'facebook' },
  { name: 'Facebook Comment', value: 'facebookComment' },
  { name: 'Friend and Family', value: 'friendAndFamily' },
  { name: 'Direct Call', value: 'directCall' },
  { name: 'Google', value: 'google' },
  { name: 'Referral', value: 'referral' },
];
const statuses = [
  { name: 'New', value: 'new' },
  { name: 'Closed (Lost)', value: 'closedLost' },
  { name: 'Closed (Won)', value: 'closedWon' },
  { name: 'Meeting (Done)', value: 'meetingDone' },
  { name: 'Meeting (Attempt)', value: 'meetingAttempt' },
  { name: 'Followed Up (Call)', value: 'followedUpCall' },
  { name: 'Followed Up (Email)', value: 'followedUpEmail' },
  { name: 'Contacted Client (Call)', value: 'contactedClientCall' },
  { name: 'Contacted Client (Call Attempt)', value: 'contactedClientCallAttempt' },
  { name: 'Contacted Client (Email)', value: 'contactedClientEmail' },
];

const getLeadsStat = async (req, res, next) => {
  const { type } = req.query;

  try {
    let pipeline = [];

    switch (type) {
      case 'status':
        pipeline = [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ];
        break;

      case 'priority':
        pipeline = [
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 },
            },
          },
        ];
        break;

      case 'source':
        pipeline = [
          {
            $group: {
              _id: '$source',
              count: { $sum: 1 },
            },
          },
        ];
        break;

      case 'property':
        pipeline = [
          {
            $group: {
              _id: '$property',
              count: { $sum: 1 },
            },
          },
        ];
        break;

      default:
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid type');
    }

    const aggregatedResult = await Leads.aggregate(pipeline);

    if (type === 'property') {
      const allProjects = await Project.find({}, { title: 1, _id: 1 });
      const projectCounts = {};

      allProjects.forEach((project) => {
        projectCounts[project._id] = 0;
      });

      aggregatedResult.forEach((item) => {
        const projectId = item._id;
        const count = item.count || 0;
        projectCounts[projectId] = count;
      });

      const updatedResult = Object.entries(projectCounts).map(([projectId, count]) => {
        const project = allProjects.find((p) => p._id.toString() === projectId);
        const name = project ? project.title : '';
        return { _id: projectId, name, count };
      });
      return updatedResult;
    } else {
      const itemCounts = {};
      const allItems = type == 'priority' ? priorities : type == 'source' ? sources : statuses;

      allItems.forEach((item) => {
        itemCounts[item.value] = 0;
      });

      aggregatedResult.forEach((item) => {
        const itemName = item._id;
        const count = item.count || 0;
        itemCounts[itemName] = count;
      });

      const updatedResult = Object.keys(itemCounts).map((itemValue) => {
        const itemName = allItems.find((item) => item.value === itemValue)?.name || itemValue;
        return { _id: itemValue, name: itemName, count: itemCounts[itemValue] };
      });

      return updatedResult;
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
  }
};

const searchLead = async (req, res, next) => {
  try {
    const { query } = req.query;

    const foundLeads = await Leads.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'client',
          foreignField: '_id',
          as: 'clientData',
        },
      },
      {
        $match: {
          $or: [
            { 'clientData.firstName': { $regex: new RegExp(query, 'i') } },
            { 'clientData.lastName': { $regex: new RegExp(query, 'i') } },
            { 'clientData.username': { $regex: new RegExp(query, 'i') } },
            { 'clientData.phone': { $regex: new RegExp(query, 'i') } },
            { status: { $regex: new RegExp(query, 'i') } },
            { priority: { $regex: new RegExp(query, 'i') } },
            { city: { $regex: new RegExp(query, 'i') } },
          ],
        },
      },
      {
        $project: {
          client: { $arrayElemAt: ['$clientData', 0] },
          city: 1,
          priority: 1,
          status: 1,
          source: 1,
          description: 1,
          uid: 1,
        },
      },
    ]);

    return foundLeads;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
  }
};

const filterLead = async (req, res, next) => {
  const { startingDate, endingDate, ...filters } = req.query;

  try {
    let query = Leads.find(filters);

    if (startingDate && isValidDate(startingDate)) {
      const startDate = new Date(startingDate);
      startDate.setHours(0, 0, 0, 0);
      query = query.where('createdAt').gte(startDate);
    }

    if (endingDate && isValidDate(endingDate)) {
      const endDate = new Date(endingDate);
      endDate.setHours(23, 59, 59, 999);

      if (query.model.modelName === 'Leads') {
        query = query.where('createdAt').lte(endDate);
      }
    }

    query = await query.populate('property').populate('client').populate('allocatedTo').exec();
    query = await query.populate('client').populate('allocatedTo').exec();

    return query;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

const createLead = async (leadBody) => {
  try {
    const { city, priority, property, status, source, description, count, clientName, clientPhone ,sessionID} =leadBody;

    const foundLead = await User.findOne({ contactNumber: clientPhone });

    const leadsToCreate = Number(count) || 1;
    const createdLeads = [];

    for (let i = 0; i < leadsToCreate; i++) {
      const newLead = await Leads.create({
        client: foundLead ? foundLead._id : null,
        city,
        clientName,
        clientPhone,
        priority,
        property,
        status,
        source,
        description,
        sessionID
      });

      const populatedLead = await Leads.findById(newLead._id)
        .populate('client')
        .populate('property')
        .populate('allocatedTo')
        .exec();

      createdLeads.push(populatedLead);
    }

    return createdLeads;
  } catch (err) {
    console.log(err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

const updateLead = async (updateBody) => {
  try {
    const { leadId } = req.params;
    const { city, priority, property, status, source, description } = updateBody;

    const updatedLead = await Leads.findByIdAndUpdate(
      leadId,
      { city, priority, property, status, source, description, ...updateBody },
      { new: true }
    )
      .populate('property')
      .populate('client')
      .populate('allocatedTo')
      .exec();
    return updatedLead;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

const shiftLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { shiftTo } = req.body;

    const updatedLead = await Leads.findByIdAndUpdate(leadId, { $set: { allocatedTo: [shiftTo] } }, { new: true })
      .populate('property')
      .populate('client')
      .populate('allocatedTo')
      .exec();

    return updatedLead;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

const shareLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { shareWith } = req.body;

    const updatedLead = await Leads.findByIdAndUpdate(leadId, { $push: { allocatedTo: shareWith } }, { new: true })
      .populate('property')
      .populate('client')
      .populate('allocatedTo')
      .exec();

    return updatedLead;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

const archiveLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const result = await Leads.findByIdAndUpdate(leadId, { $set: { isArchived: true } }, { new: true });
    res.status(200).json({ result, message: 'Leads archived successfully', success: true });
  } catch (err) {
    next(ApiError(500, err.message));
  }
};

const deleteLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const foundLead = await Leads.findById(leadId);

    if (!foundLead) {
      throw new ApiError(httpStatus.NOT_FOUND, 'lead not found');
    }

    const deletedLead = await Leads.findByIdAndDelete(leadId);
    return deletedLead;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

const deleteWholeCollection = async (req, res, next) => {
  try {
    const result = await Leads.deleteMany();
    return result;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
  }
};

module.exports = {
  getLead,
  getLeads,
  getLeadByPhone,
  getLeadBySessionId,
  getLeadsStat,
  getEmployeeLeads,
  shiftLead,
  shareLead,
  archiveLead,
  deleteLead,
  deleteWholeCollection,
  filterLead,
  createLead,
  updateLead,
  searchLead,
};
