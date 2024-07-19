const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const SuccessResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const { employeeService, builderAgentService, projectService } = require('../services');
const { getSignedUrlMultiple } = require('../services/s3.service');
const { RoleType, PREFIXES } = require('../utils/constants');
const { checkUser } = require('../services/admin.service');
const keyprefix = 'project/images';

const getEmployee = catchAsync(async (req, res) => {
  const employeeId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provide valid Employee Id');
  }
  const employee = await employeeService.getEmployeeById(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
  }
  return new SuccessResponse(httpStatus.OK, 'Employee details retrived successfully', employee).send(res);
});

const getEmployeeByAgentBuilder = catchAsync(async (req, res) => {
  const builderId = req.user._id;
  const employeeId = req.params.employeeId

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provide valid Employee Id');
  }

  const employee = await employeeService.getEmployeeBuilderAgentById(employeeId, builderId);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'employee not found');
  }
  return new SuccessResponse(httpStatus.OK, 'employee details retrived successfully', employee).send(res);
});

const getEmployees = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['fullName', 'role', 'email', 'contactNumber', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const builderData = await employeeService.queryEmployees(filter, options);
  return new SuccessResponse(httpStatus.OK, 'Employees data retrived successfully', builderData).send(res);
});

const getEmployeeProjectById = catchAsync(async (req, res) => {
  const employeeId = req.user._id;
  const projectId = req.params.projectId

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provide valid Employee Id');
  }

  await employeeService.getEmployeeById(employeeId);

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
  }

  const project = await projectService.getEmployeeProjectById(employeeId, projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'project not found');
  }

  if ((project.images && project.images.length > 0) || (project.gallery && project.gallery.length > 0) || (project.amenities && project.amenities.length > 0)) {
    if (project.images && project.images.length > 0) {
      const imagesUrls = await getSignedUrlMultiple(project.images.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
      project.images = project.images.map((item, index) => ({ _id: item._id, url: imagesUrls[index] }));
  }

  if (project.gallery && project.gallery.length > 0) {
      const galleryUrls = await getSignedUrlMultiple(project.gallery.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
      project.gallery = project.gallery.map((item, index) => ({ _id: item._id, url: galleryUrls[index] }));
  }

  if (project.amenities && project.amenities.length > 0) {
      const amenityUrls = await getSignedUrlMultiple(project.amenities.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
      project.amenities = project.amenities.map((item, index) => ({ _id: item._id, url: amenityUrls[index] }));
  }

  if (project.layout && project.layout.length > 0) {
      const layoutUrls = await getSignedUrlMultiple(project.layout.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
      project.layout = project.layout.map((item, index) => ({ _id: item._id, url: layoutUrls[index] }));
  }

  if (project.highlights && project.highlights.length > 0) {
      const highlightsUrls = await getSignedUrlMultiple(project.highlights.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
      project.highlights = project.highlights.map((item, index) => ({ _id: item._id, url: highlightsUrls[index] }));
  }

  if (project.floorPlans && project.floorPlans.length > 0) {
      const floorPlansUrls = await getSignedUrlMultiple(project.floorPlans.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
      project.floorPlans = project.floorPlans.map((item, index) => ({ _id: item._id, url: floorPlansUrls[index] }));
  }
  if (project.videos && project.videos.length > 0) {
      const videosUrls = await getSignedUrlMultiple(project.videos.map(item => item.url), PREFIXES.PROJECT_VIDEOS_PREFIX);
      project.videos = project.videos.map((item, index) => ({ _id: item._id, url: videosUrls[index] }));
  }
  if (project.docs && project.docs.length > 0) {
      const docsUrls = await getSignedUrlMultiple(project.docs.map(item => item.url), PREFIXES.PROJECT_DOCS_PREFIX);
      project.docs = project.docs.map((item, index) => ({ _id: item._id, url: docsUrls[index] }));
  }
  } else {
    throw new ApiError(httpStatus.FORBIDFDEN, "No images, gallery, or amenities to retrive.");
  }

  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'project not found');
  }
  return new SuccessResponse(httpStatus.OK, 'project retrived successfully', project).send(res);
});

const getEmployeeProjects = catchAsync(async (req, res) => {
  const employeeId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provide valid Employee Id');
  }

  const projects = await projectService.getProjectsByEmployeeId(employeeId);
  if (!projects) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
  }
  return new SuccessResponse(httpStatus.OK, 'Employee projects retrived successfully', projects).send(res);
});

//access builder/agent
const getEmployeesByBuilderAgent = catchAsync(async (req, res) => {
  const builderId = req.user?._id

  if (!mongoose.Types.ObjectId.isValid(builderId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder Id");
  }
  const employees = await employeeService.getEmployeesByBuilder(builderId);
  if (!employees) {
    throw new ApiError(httpStatus.NOT_FOUND, 'employees not found');
  }
  return new SuccessResponse(httpStatus.OK, 'employees retrived successfully', employees).send(res);
})

const updateEmployee = catchAsync(async (req, res) => {
  const { employeeId } = req.params
  const updateBody = req.body
  const { _id: userId, role: userRole } = req.user;
  const adUserId = req.params.userId;
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

  if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provide valid Builder Id');
  }
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provide valid Employee Id');
  }
  await checkUser(userRole, userId, actualUserId)
  const employee = await employeeService.updateEmployeeById(employeeId, updateBody, actualUserId);
  return new SuccessResponse(httpStatus.OK, 'Employee details updated successfully', employee).send(res);
});

const deleteEmployee = catchAsync(async (req, res) => {
  const employeeId = req.params.employeeId
  const { _id: userId, role: userRole } = req.user;
  const adUserId = req.params.userId;
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

  if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder Id");
  }

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid employee Id");
  }
  const findBuilder = await builderAgentService.getBuilderAgentById(actualUserId);
  if (!findBuilder) {
    throw new ApiError(httpStatus.NOT_FOUND, `builder/agent not found, unable to delete`);
  }
  const actualUserRole = userRole === RoleType.ADMIN ? findBuilder.role : userRole;
  await employeeService.getEmployeeBuilderAgentById(employeeId, actualUserId);
  const projects = await projectService.getProjectsByEmployeeId(employeeId);

  if (projects.length > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee is assigned to project,unable to delete');
  }

  const builderUpdate = await builderAgentService.updateBuilderById(actualUserId, {
    $pull: { employees: employeeId }
  }, actualUserRole);

  if (!builderUpdate || builderUpdate.nModified === 0) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update builder');
  }

  await employeeService.deleteEmployeeById(employeeId, actualUserRole, actualUserId);
  return new SuccessResponse(httpStatus.OK, 'Employee deleted successfully').send(res);
});

module.exports = { getEmployee, updateEmployee, getEmployees, deleteEmployee, getEmployeesByBuilderAgent, getEmployeeProjects, getEmployeeProjectById, getEmployeeByAgentBuilder }