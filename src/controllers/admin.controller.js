const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { adminService, projectService } = require('../services');
const SuccessResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const { getBuilderAgentById } = require('../services/builder.service');
const { getEmployeeById } = require('../services/employee.service');
const { getSignedUrlMultiple } = require('../services/s3.service');

const keyprefix = 'project/images';

const getAdmin = catchAsync(async (req, res) => {
  const adminId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provide valid admin Id');
  }
  const admin = await adminService.getAdminById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }
  return new SuccessResponse(httpStatus.OK, 'Admin details retrived successfully', admin).send(res);
});

const updateAdmin = catchAsync(async (req, res) => {
  const adminId = req.user._id;
  const updateBody = req.body

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provide valid Builder Id');
  }

  const adminCheck = await adminService.getAdminById(adminId);

  if (!adminCheck) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }
  const admin = await adminService.updateAdminById(adminId, updateBody);
  return new SuccessResponse(httpStatus.OK, 'Admin details updated successfully', admin).send(res);
});

const getBuilderAgent = catchAsync(async (req, res) => {
  const { userId } = req.params

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.NOT_FOUND, `provide valid user Id`);
  }

  const user = await getBuilderAgentById(userId)

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "builder or agent not found");
  }

  return new SuccessResponse(httpStatus.OK, "user details retrieved successfully", user).send(res);
});

const getEmployee = catchAsync(async (req, res) => {
  const employeeId = req.params.id

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new ApiError(httpStatus.NOT_FOUND, `provide valid employee Id`);
  }

  const employee = await getEmployeeById(employeeId)

  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "employee not found");
  }

  return new SuccessResponse(httpStatus.OK, "employee details retrieved successfully", employee).send(res);
});

const getProject = catchAsync(async (req, res) => {
  const { projectId } = req.params
  const adminId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid admin Id");
  }

  const admin = await adminService.getAdminById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
  }
  let project = await projectService.getProject(projectId);

  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  if ((project.images && project.images.length > 0) || (project.gallery && project.gallery.length > 0) || (project.amenities && project.amenities.length > 0)) {
    if (project.images && project.images.length > 0) {
      const imagesUrls = await getSignedUrlMultiple(project.images.map(item => item.url), keyprefix);
      project.images = project.images.map((item, index) => ({ _id: item._id, url: imagesUrls[index] }));
    }

    if (project.gallery && project.gallery.length > 0) {
      const galleryUrls = await getSignedUrlMultiple(project.gallery.map(item => item.url), keyprefix);
      project.gallery = project.gallery.map((item, index) => ({ _id: item._id, url: galleryUrls[index] }));
    }

    if (project.amenities && project.amenities.length > 0) {
      const amenityUrls = await getSignedUrlMultiple(project.amenities.map(item => item.url), keyprefix);
      project.amenities = project.amenities.map((item, index) => ({ _id: item._id, url: amenityUrls[index] }));
    }

    if (project.layout && project.layout.length > 0) {
      const layoutUrls = await getSignedUrlMultiple(project.layout.map(item => item.url), keyprefix);
      project.layout = project.layout.map((item, index) => ({ _id: item._id, url: layoutUrls[index] }));
    }

    if (project.highlights && project.highlights.length > 0) {
      const highlightsUrls = await getSignedUrlMultiple(project.highlights.map(item => item.url), keyprefix);
      project.highlights = project.highlights.map((item, index) => ({ _id: item._id, url: highlightsUrls[index] }));
    }

    if (project.floorPlans && project.floorPlans.length > 0) {
      const floorPlansUrls = await getSignedUrlMultiple(project.floorPlans.map(item => item.url), keyprefix);
      project.floorPlans = project.floorPlans.map((item, index) => ({ _id: item._id, url: floorPlansUrls[index] }));
    }
    if (project.videos && project.videos.length > 0) {
      const videosUrls = await getSignedUrlMultiple(project.videos.map(item => item.url), keyprefix);
      project.videos = project.videos.map((item, index) => ({ _id: item._id, url: videosUrls[index] }));
    }
    if (project.docs && project.docs.length > 0) {
      const docsUrls = await getSignedUrlMultiple(project.videos.map(item => item.url), keyprefix);
      project.docs = project.docs.map((item, index) => ({ _id: item._id, url: docsUrls[index] }));
    }
  } else {
    throw new ApiError(httpStatus.FORBIDDEN, "No images, gallery, or amenities to retrive.");
  }

  return new SuccessResponse(httpStatus.OK, `project retrived successfully`, project).send(res);
});

module.exports = { getAdmin, updateAdmin, getBuilderAgent, getEmployee, getProject }