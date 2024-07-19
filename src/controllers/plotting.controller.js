const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { plottingService, projectService, builderAgentService } = require('../services');
const { s3DeleteSingle, getSignedUrl, s3UploadSingle } = require('../services/s3.service');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick')
const SuccessResponse = require('../utils/ApiResponse');
const { PREFIXES, RoleType } = require('../utils/constants');
const { checkUser, UserCheck } = require('../services/admin.service');

const createPlotting = catchAsync(async (req, res) => {
  const { _id: userId, role: userRole } = req.user;
  const files = req.files;
  const adUserId = userRole === RoleType.ADMIN && req.query.builderId;
  const { projectId } = req.params;
  const { projectLocation, websiteUrl, layoutData } = req.body
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
  }
  await checkUser(userRole, userId, actualUserId)
  const project = await projectService.getProjectById(projectId, actualUserId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  const plotting = await plottingService.createPlotting({ projectLocation, websiteUrl, files, projectId, actualUserId, layoutData });
  return new SuccessResponse(httpStatus.CREATED, 'plotting created successfully', plotting).send(res);
});

const getPlotting = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { builderId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
  }
  await builderAgentService.getBuilderAgentById(builderId);
  const project = await projectService.getProjectById(projectId, builderId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  const plotCheck = await plottingService.getPlotting(projectId, builderId);
  if (!plotCheck) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plot not found');
  }

  const plotData = {
    projectLocation: plotCheck.projectLocation,
    websiteUrl: plotCheck.websiteUrl,
    plotSvgName: plotCheck.plotSvg,
    plotImageName: plotCheck.plotImage,
    logoName: plotCheck.logo,
    project: plotCheck.projectId,
    logo: plotCheck.logo,
    plotSvg: plotCheck.plotSvg,
    plotImage: plotCheck.plotImage,
    mapImage: plotCheck.mapImage,
    highlightsImage: plotCheck.highlightsImage,
    layoutData: plotCheck.layoutData
  }

  const urlsConfig = [
    { key: 'logo', prefix: PREFIXES.PLOTTING_LOGO_PREFIX },
    { key: 'plotImage', prefix: PREFIXES.PLOTTING_IMG_PREFIX },
    { key: 'plotSvg', prefix: PREFIXES.PLOTTING_SVG_PREFIX },
    { key: 'mapImage', prefix: PREFIXES.PLOTTING_IMG_PREFIX },
    { key: 'highlightsImage', prefix: PREFIXES.PLOTTING_IMG_PREFIX }
  ];

  for (const { key, prefix } of urlsConfig) {
    plotData[key] = await getSignedUrl(plotCheck[key], prefix);
  }
  return new SuccessResponse(httpStatus.OK, 'plotting retrived successfully', plotData).send(res);
});

const getBuildersPlotting = catchAsync(async (req, res) => {
  const { _id: userId, role: userRole } = req.user;
  const adUserId = userRole === RoleType.ADMIN && req.query.builderId;
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

  if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid user Id");
  }

  await checkUser(userRole, userId, actualUserId)
  const result = await plottingService.getBuilderPlotting(actualUserId);
  return new SuccessResponse(httpStatus.OK, 'plots retrived successfully', result).send(res);
});

const getAllPlotting = catchAsync(async (req, res) => {
  const { _id: userId, role: userRole } = req.user;
  const filter = pick(req.query, ['projectId', 'builderId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  console.log(userRole, userId)
  await UserCheck(userRole, userId)
  const plots = await plottingService.getAllPlots(filter, options);
  return new SuccessResponse(httpStatus.OK, 'plots retrived successfully', plots).send(res);
});

const updatePlotting = catchAsync(async (req, res) => {
  const { _id: userId, role: userRole } = req.user;
  const { projectId } = req.params;
  const updateBody = req.body;
  const files = req.files;
  const adUserId = userRole === RoleType.ADMIN && req.query.builderId;
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
  }
  await checkUser(userRole, userId, actualUserId)
  const project = await projectService.getProjectById(projectId, actualUserId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  const oldPlotting = await plottingService.getPlotting(projectId, actualUserId);

  const validKeys = ['plotSvg', 'plotImage', 'logo', 'mapImage', 'highlightsImage'];
  const getS3KeyPrefix = (key) => {
    switch (key) {
      case 'plotSvg':
        return PREFIXES.PLOTTING_SVG_PREFIX;
      case 'plotImage':
        return PREFIXES.PLOTTING_IMG_PREFIX;
      case 'logo':
        return PREFIXES.PLOTTING_LOGO_PREFIX;
      case 'mapImage':
        return PREFIXES.PLOTTING_IMG_PREFIX;
      case 'highlightsImage':
        return PREFIXES.PLOTTING_IMG_PREFIX
      default:
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid file key");
    }
  };

  const fileUpload = async (key, file, updateBody) => {
    file.originalname = `spim-${Date.now()}-${file.originalname}`;
    await s3UploadSingle({ originalname: file.originalname, buffer: file.buffer }, getS3KeyPrefix(key));
    updateBody[key] = file.originalname;
  };

  const deleteOldOnes = async (key, file, updateBody) => {
    const oldFilename = oldPlotting[key];
    if (oldFilename) {
      await s3DeleteSingle({ filename: oldFilename }, getS3KeyPrefix(key));
    }
    await fileUpload(key, file, updateBody);
  };
  //files are exists
  if (files && Object.keys(files).length > 0) {
    for (let [key, fileArray] of Object.entries(files)) {
      if (!validKeys.includes(key)) {
        console.error(`Invalid key for upload: ${key}`);
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid file key");
      }
      for (let file of fileArray) {
        await deleteOldOnes(key, file, updateBody);
      }
    }
  }

  const updatedPlotting = await plottingService.updatePlotting(projectId, actualUserId, updateBody);
  return new SuccessResponse(httpStatus.OK, `Plotting updated successfully`, updatedPlotting).send(res);
});

const deletePlotting = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { _id: userId, role: userRole } = req.user;
  const adUserId = userRole === RoleType.ADMIN && req.query.builderId;
  const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;
  await checkUser(userRole, userId, actualUserId)
  await plottingService.deletePlotting(projectId, actualUserId); //builderId when admin login
  return new SuccessResponse(httpStatus.OK, 'plotting deleted successfully').send(res);
});

module.exports = {
  createPlotting,
  getPlotting,
  getBuildersPlotting,
  getAllPlotting,
  updatePlotting,
  deletePlotting,
};
