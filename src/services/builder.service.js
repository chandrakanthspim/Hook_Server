const httpStatus = require('http-status');
const { Builder, Employee, Project } = require('../models');
const ApiError = require('../utils/ApiError');
const { UserStatus, RoleType, PREFIXES } = require('../utils/constants');
const { s3DeleteMultiple } = require('./s3.service');
const bcrypt = require('bcryptjs');
const { getPlanById } = require('./plan.service');

/**
 * Create a builder
 * @param {Object} builderBody
 * @returns {Promise<Builder>}
 */
const createBuilderAgent = async (builderBody, role) => {
  if (role === RoleType.ADMIN) {
    return await Builder.create(builderBody);
  } else {
    throw new Error('Unauthorized role');
  }
};

/**
 * Query for builders
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryBuilders = async (filter, options) => {
  const builders = await Builder.paginate(filter, options);
  return builders;
};

/**
 * Get builder by id
 * @param {ObjectId} id
 * @returns {Promise<Builder>}
 */

const getBuilderAgentById = async (id) => {
  const desiredFields = "fullName email contactNumber gender profilePic isEmailVerified projects plan planHistory status employees role";
  const user = await Builder.findById(id)
    .select(desiredFields)
    .populate('projects', 'title')
    .populate({
      path: 'plan',
      populate: {
        path: 'planId',
        select: "planType duration"
      }
    })
    .populate('createdBy', 'fullName')
    .populate('employees', 'fullName');

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, `Builder or agent not found`);
  }
  const currentDate = new Date();
  if (user.plan?.planExpiry < currentDate && user.status !== UserStatus.INACTIVE) {
    user.status = UserStatus.INACTIVE;

    // Decrement the userCount in the Plan schema
    const plan = await getPlanById(user.plan.planId);
    if (plan) {
      plan.userCount = plan.userCount ? plan.userCount - 1 : 0;
      await plan.save();
    }
    await user.save();
  }

  return user;
};


const getBuilderAgentPlanCheck = async (id) => {
  const user = await Builder.findOne({ plan: id })
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, `builder or agent is not found`);
  }
  return user;
};

/**
 * Get builder by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getBuilderByEmail = async (email) => {
  const builder = await Builder.findOne({ email });
  if (!builder) {
    throw new ApiError(httpStatus.NOT_FOUND, 'builder or agent not found');
  }
  return builder
};

const getAgentByEmail = async (email) => {
  const agent = await Builder.findOne({ email });
  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'agent not found');
  }
  return agent
};

/**
 * Update builder by id
 * @param {ObjectId} builderId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateBuilderById = async (userId, updateBody, role) => {
  const builder = await getBuilderAgentById(userId);
  const allowedFields = ['fullName', 'email', 'password', 'address', 'contactNumber', 'gender', 'employees'];
  if (role === 'admin') {
    allowedFields.push('isEmailVerified', 'status', 'plan', 'planHistory');
  } else {
    const restrictedFields = ['status', 'plan', 'planHistory'];
    if (Object.keys(updateBody).some(field => restrictedFields.includes(field))) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this field or contact admin');
    }
  }

  const filteredUpdateBody = Object.keys(updateBody)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateBody[key];
      return obj;
    }, {});

  if (filteredUpdateBody.email && filteredUpdateBody.email !== builder.email && (await Builder.isEmailTaken(filteredUpdateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (updateBody.$pull && updateBody.$pull.projects) {
    builder.projects.pull(updateBody.$pull.projects);
    delete updateBody.$pull.projects; // Remove the projects field from updateBody to avoid conflicts with other updates
  }
  if (updateBody.$pull && updateBody.$pull.employees) {
    builder.employees.pull(updateBody.$pull.employees);
    delete updateBody.$pull.employees; // Remove the employees field from updateBody to avoid conflicts with other updates
  }

  if (Object.keys(updateBody).length > 0) {
    Object.assign(builder, updateBody);
  }
  Object.assign(builder, filteredUpdateBody);
  await builder.save();
  return builder;
};

const upgradePlan=async(userId, updateBody,planRef,role)=>{
  const builder = await getBuilderAgentById(userId);

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + planRef.duration.value);

  if (role === 'admin' && updateBody.plan) {
    // Update the plan details
    builder.plan.planId = updateBody.plan;
    builder.plan.paidAmount = updateBody.paidAmount;
    builder.plan.remainingAmount = planRef.price - updateBody.paidAmount;
    builder.plan.planExpiry = expiryDate;
    builder.plan.comment = updateBody?.comment;
    builder.plan.date = new Date();
    builder.status= UserStatus.ACTIVE;

    const currentPlan = {
      plan: updateBody.planId,
      paidAmount: updateBody.paidAmount,
      remainingAmount: planRef.price - updateBody.paidAmount,
      comment: updateBody.comment,
      date : new Date(),
    };

    builder.planHistory.push(currentPlan);
  }

  // Save the builder object
  planRef.userCount = planRef.userCount ? planRef.userCount + 1 : 1;
  await planRef.save();
  await builder.save();
  return builder;
}

const updateBuilderPassword = async (builderId, newPassword) => {
  const builder = await getBuilderAgentById(builderId);
  if (!builder) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Builder or Agent not found');
  }
  const hashedPassword = await bcrypt.hash(newPassword, 8);
  return Builder.findByIdAndUpdate(builderId, { password: hashedPassword }, { new: true });
};

/**
 * Delete builder by id
 * @param {ObjectId} builderId
 * @returns {Promise<Builder>}
 */

const deleteProjectsByBuilderId = async (builderId) => {
  const projects = await Project.find({ createdBy: builderId });
  for (const project of projects) {
    const imageUrls = [];

    if (project.amenities && project.amenities.length > 0) {
      imageUrls.push(...project.amenities.map(amenity => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${amenity.url}` })));
    }
    if (project.highlights && project.highlights.length > 0) {
      imageUrls.push(...project.highlights.map(highlight => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${highlight.url}` })));
    }
    if (project.gallery && project.gallery.length > 0) {
      imageUrls.push(...project.gallery.map(gallery => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${gallery.url}` })));
    }
    if (project.layout && project.layout.length > 0) {
      imageUrls.push(...project.layout.map(layout => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${layout.url}` })));
    }
    if (project.floorPlans && project.floorPlans.length > 0) {
      imageUrls.push(...project.floorPlans.map(floorPlan => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${floorPlan.url}` })));
    }
    if (project.videos && project.videos.length > 0) {
      imageUrls.push(...project.videos.map(video => ({ url: `${PREFIXES.PROJECT_VIDEOS_PREFIX}/${video.url}` })));
    }
    if (project.docs && project.docs.length > 0) {
      imageUrls.push(...project.docs.map(doc => ({ url: `${PREFIXES.PROJECT_DOCS_PREFIX}/${doc.url}` })));
    }

    // Delete images from AWS S3
    if (imageUrls.length > 0) {
      await s3DeleteMultiple(imageUrls);
    }
    await project.remove();
  }
};

const deleteEmployeesByBuilderId = async (builderId) => {
  const employees = await Employee.find({ createdBy: builderId });
  for (const employee of employees) {
    await employee.remove();
  }
};

const deleteBuilderById = async (builderId, userRole, role) => {
  const builder = await getBuilderAgentById(builderId)
  const userPlan = await getPlanById(builder.plan._id);

  if (!userPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  if (userRole === RoleType.ADMIN) {
    await deleteProjectsByBuilderId(builderId);
    await deleteEmployeesByBuilderId(builderId);
    await builder.remove();
    if (userPlan.userCount && userPlan.userCount > 0) {
      userPlan.userCount -= 1;
      await userPlan.save();
    }
    return builder;
  }
};

module.exports = {
  createBuilderAgent,
  queryBuilders,
  getBuilderAgentById,
  getBuilderAgentPlanCheck,
  getBuilderByEmail,
  getAgentByEmail,
  upgradePlan,
  updateBuilderById,
  updateBuilderPassword,
  deleteBuilderById,
  deleteEmployeesByBuilderId,
  deleteProjectsByBuilderId
};


// const updateBuilderById = async (userId, updateBody, role) => {
//   const builder = await getBuilderAgentById(userId);
  
//   // Define allowed and restricted fields based on user role
//   const allowedFields = ['fullName', 'email', 'password', 'address', 'contactNumber', 'gender', 'employees'];
//   const restrictedFields = role === 'admin' ? [] : ['status', 'plan', 'planHistory'];

//   // Check if user is allowed to update restricted fields
//   if (Object.keys(updateBody).some(field => restrictedFields.includes(field))) {
//     throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this field. Contact admin for assistance.');
//   }

//   // Validate and filter update fields
//   const filteredUpdateBody = Object.keys(updateBody)
//     .filter(key => allowedFields.includes(key))
//     .reduce((obj, key) => {
//       obj[key] = updateBody[key];
//       return obj;
//     }, {});

//   // Check if email is being updated and verify if it's already taken
//   if (filteredUpdateBody.email && filteredUpdateBody.email !== builder.email && (await Builder.isEmailTaken(filteredUpdateBody.email, userId))) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
//   }

//   // Handle updating the plan and storing in planHistory
//   if (role === 'admin' && updateBody.plan) {
//     const currentPlan = {
//       plan: builder.plan.planId,
//       paidAmount: builder.plan.paidAmount,
//       remainingAmount: builder.plan.remainingAmount,
//       paymentDate: builder.plan.date,
//       comment: builder.plan.comment,
//     };

//     builder.planHistory.push(currentPlan); // Add current plan to history

//     // Update the plan details
//     builder.plan.planId = updateBody.plan.planId;
//     builder.plan.paidAmount = updateBody.plan.paidAmount;
//     builder.plan.remainingAmount = planCheck.price - updateBody.paidAmount - builder.plan.paidAmount;
//     builder.plan.comment = updateBody.plan.comment || builder.plan.comment;
//     builder.plan.planExpiry = updateBody.plan.planExpiry || builder.plan.planExpiry;
//     builder.plan.date = new Date();
//   }

//   // Save the builder object
//   await builder.save();
//   return builder;
// };
