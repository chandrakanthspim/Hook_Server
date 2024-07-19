const httpStatus = require('http-status');
const { Plotting } = require('../models');
const ApiError = require('../utils/ApiError');
const { s3DeleteMultiple, s3UploadSingle } = require('./s3.service');
const { PREFIXES } = require('../utils/constants');
/**
 * Create a user
 * @param {Object} availibility
 * @returns {Promise<Availibilty>}
 */
const createPlotting = async ({ projectLocation, websiteUrl, files, projectId, actualUserId, layoutData }) => {
  const plotting = await Plotting.findOne({ projectId, builderId: actualUserId })
  if (plotting) {
    throw new ApiError(httpStatus.FORBIDDEN, 'plotting already exists for this project');
  }
  if (files) {
    for (let f of Object.entries(files)) {
      for (let x of f[1]) {
        x.originalname = `spim-${Date.now()}-${x.originalname}`;
      }
    }
  }

  const layout = JSON.parse(layoutData);
  const data = {
    projectLocation,
    websiteUrl,
    projectId: projectId,
    builderId: actualUserId,
    plotSvg: files['plotSvg'][0].originalname,
    logo: files['logo'][0].originalname,
    plotImage: files['plotImage'][0].originalname,
    mapImage: files['mapImage'][0].originalname,
    highlightsImage: files['highlightsImage'][0].originalname,
    layoutData: layout,
  };
  const uploadConfigs = [
    { file: files['plotSvg'][0], prefix: PREFIXES.PLOTTING_SVG_PREFIX },
    { file: files['logo'][0], prefix: PREFIXES.PLOTTING_LOGO_PREFIX },
    { file: files['plotImage'][0], prefix: PREFIXES.PLOTTING_IMG_PREFIX },
    { file: files['mapImage'][0], prefix: PREFIXES.PLOTTING_IMG_PREFIX },
    { file: files['highlightsImage'][0], prefix: PREFIXES.PLOTTING_IMG_PREFIX }
  ];

  for (const { file, prefix } of uploadConfigs) {
    console.log({ originalname: file.originalname, buffer: file.buffer })
    await s3UploadSingle({ originalname: file.originalname, buffer: file.buffer }, prefix);
  }
  return Plotting.create(data);
};

const getPlotting = async (projectId, actualUserId) => {
  const plotting = await Plotting.findOne({ projectId, builderId: actualUserId })
    .populate('projectId', 'title description contactNumber address')
    .populate('builderId', 'email');
  if (!plotting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plotting not found');
  }
  return plotting
};

const getBuilderPlotting = async (builderId) => {
  const plotting = await Plotting.findOne(builderId)
    .populate('projectId', 'title description contactNumber')
    .populate('builderId', 'email');
  if (!plotting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plots not found');
  }
  return plotting
};

const getAllPlots = async (filter, options) => {
  const plots = await Plotting.paginate(filter, options);
  return plots;
};

const deletePlotting = async (projectId, actualUserId) => {
  const plotting = await getPlotting(projectId, actualUserId);
  const filesToDelete = [
    { url: `${PREFIXES.PLOTTING_SVG_PREFIX}/${plotting.plotSvg}`, },
    { url: `${PREFIXES.PLOTTING_IMG_PREFIX}/${plotting.plotImage}` },
    { url: `${PREFIXES.PLOTTING_IMG_PREFIX}/${plotting.logo}` },
    { url: `${PREFIXES.PLOTTING_IMG_PREFIX}/${plotting.mapImage}` },
    { url: `${PREFIXES.PLOTTING_IMG_PREFIX}/${plotting.highlightsImage}` },
  ];

  await s3DeleteMultiple(filesToDelete);
  await plotting.remove();

};

const updatePlotting = async (projectId, actualUserId, updateBody) => {
  const plot = await getPlotting(projectId, actualUserId);
  // Parse layout if provided
  if (updateBody.layoutData) {
    updateBody.layoutData = JSON.parse(updateBody.layoutData);
  }

  // Update plot fields
  Object.keys(updateBody).forEach(key => {
    plot[key] = updateBody[key];
  });

  await plot.save();
  return plot;
};

module.exports = {
  createPlotting,
  getPlotting,
  getBuilderPlotting,
  getAllPlots,
  updatePlotting,
  deletePlotting,
};
