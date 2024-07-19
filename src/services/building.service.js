const httpStatus = require('http-status');
const { Building } = require('../models');
const ApiError = require('../utils/ApiError');
const { s3UploadMultiple, s3UploadSingle, getSignedUrlMultiple, getSignedUrl } = require('./s3.service');
// const Building = require("../models/availibility.model");

/**
 * Create a user
 * @param {Object} buildingBody
 * @returns {Promise<Building>}
 */
const createBuilding = async ({ files, projectId, builderId, metadata }) => {
  try {
    let data = {
      towers: [],
      floors: [],
      flats: [],
      rooms: [],
    };
    const metadataParsed = JSON.parse(metadata);
    const keyprefix = 'buildings/apartments/svg';
    if (files) {
      for (let f of Object.entries(files)) {
        for (let x of f[1]) {
          // x.buffer = undefined;
          // if (f[0] == 'masterPlanLayout') continue;
          x.filename = `${Date.now()}-spim-${x.originalname}`;
        }
      }
    }
    await Promise.all(Object.values(files).map(async (ele) => await s3UploadMultiple(ele, keyprefix)));
    // return { files };
    if (files) {
      for (let f of Object.entries(files)) {
        data[f[0]] = [];
        for (let x of f[1]) {
          if (f[0] == 'masterPlanLayout') continue;
          let tempdata = {};
          let metaElement = metadataParsed.find((ele) => x.originalname === ele.filename);
          // console.log(metaElement, x);
          let tempID = metaElement.id.split('_');
          switch (f[0]) {
            case 'towers':
              tempdata['towerId'] = tempID[0];
              break;
            case 'floors':
              tempdata['towerId'] = tempID[0];
              tempdata['floorId'] = tempID[1];
              break;
            case 'flats':
              tempdata['towerId'] = tempID[0];
              tempdata['floorId'] = tempID[1];
              tempdata['flatId'] = tempID[2];
              break;
            default:
              break;
          }
          tempdata['completeId'] = metaElement.id;
          tempdata['url'] = 'url.com';
          tempdata['originalname'] = x.originalname;
          tempdata['filename'] = x.filename;
          data[f[0]].push(tempdata);
        }
      }
    }
    const masterPlanLayout = {
      url: 'url.com',
      originalname: files['masterPlanLayout'][0].originalname,
      filename: `${Date.now()}-spim-${files['masterPlanLayout'][0].filename}`,
    };
    // const mapArray = ['towers', 'floors', 'flats', 'rooms'];
    // await Promise.all(mapArray.map(async (ele) => await data[ele].map(async (ele) => await s3UploadMultiple(ele))));
    // for (const keytype of mapArray) {
    //   await Promise.all(data[keytype].map(async (ele) => await s3UploadMultiple(ele)));
    // }
    // await Promise.all(Object.values(data).map(async (ele) => await s3UploadMultiple(ele)));
    await s3UploadSingle(files['masterPlanLayout'][0], keyprefix);
    // console.log(files);
    // res.send({ data });
    const buildingBody = {
      projectId,
      builderId,
      type: 'apartment',
      masterPlanLayout,
      layoutData: data,
    };
    return Building.create(buildingBody);
    // if (req.files) {
    //   for (let f of Object.entries(req.files)) {
    //     for (let x of f[1]) {
    //       fs.unlink(x.path, function (err) {
    //         if (err) console.error(err);
    //       });
    //     }
    //   }
    // }
  } catch (err) {
    console.log(err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload files');
  }
};

const deleteBuilding = async ({ projectId, builderId }) => {
  try {
    const building = await Building.findOne({ projectId, builderId });
    const svgsToDelete = [{ Key: building.masterPlanLayout }];
    const layoutData = building.layoutData;
    for (let f of Object.entries(layoutData)) {
      for (let x of f[1]) {
        svgsToDelete.push({ Key: x.filename });
      }
    }
    await s3DeleteMultiple(svgsToDelete);
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete building');
  }
};
const getBuilding = async ({ projectId, builderId }) => {
  const keyprefix = 'buildings/apartments/svg';
  try {
    const building = await Building.findOne({ projectId, builderId });
    await Promise.all(
      Object.entries(building.layoutData).map(
        async (ele) => (building.layoutData[ele[0]] = await getSignedUrlMultiple(ele[1], keyprefix))
      )
    );
    const masterPlanLayoutUrl = await getSignedUrl(building.masterPlanLayout.filename, keyprefix);
    building.masterPlanLayout.url = masterPlanLayoutUrl;
    return building;
  } catch (err) {
    console.error(err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get building');
  }
};
module.exports = {
  createBuilding,
  getBuilding,
  deleteBuilding,
};
