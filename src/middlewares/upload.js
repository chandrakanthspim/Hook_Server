const util = require('util');
const config = require('../config/config');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');

var fileStorage = new GridFsStorage({
  url: config.mongoose.url,
  options: config.mongoose.options,
  file: (req, file) => {
    // const match = ['image/png', 'image/jpeg'];

    // if (match.indexOf(file.mimetype) === -1) {
    //   const filename = `${Date.now()}-spim-${file.originalname}`;
    //   return filename;
    // }

    return {
      bucketName: 'files',
      filename: `${Date.now()}-spim-${file.originalname}`,
    };
  },
});

var photoStorage = new GridFsStorage({
  url: config.mongoose.url,
  options: config.mongoose.options,
  file: (req, file) => {
    const match = ['image/png', 'image/jpeg'];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${Date.now()}-spim-${file.originalname}`;
      return filename;
    }

    return {
      bucketName: 'photos',
      filename: `${Date.now()}-spim-${file.originalname}`,
    };
  },
});
var videoStorage = new GridFsStorage({
  url: config.mongoose.url,
  options: config.mongoose.options,
  file: (req, file) => {
    const match = ['video/mp4', 'video/webm'];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${Date.now()}-spim-${file.originalname}`;
      return filename;
    }

    return {
      bucketName: 'videos',
      filename: `${Date.now()}-spim-${file.originalname}`,
    };
  },
});
const fileUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 limit for video files
  },
}).fields([
  { name: 'svgfile', maxCount: 5 },
  { name: 'docs', maxCount: 5 },
]);

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 limit for video files
  },
}).array('videos', 5);

const imageUpload = multer({
  storage: photoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for image files
  },
}).fields([
  { name: 'amenities', maxCount: 5 },
  { name: 'images', maxCount: 5 },
  { name: 'highlights', maxCount: 5 },
  { name: 'layout', maxCount: 5 },
  { name: 'floorPlans', maxCount: 5 },
  { name: 'logo', maxCount: 1 },
]);
// -----------------------Plotting middleware
var plottingStorage = multer.memoryStorage({
  destination(req, file, cb) {
    cb(null, './my-uploads');
  },
});
var plottingUpload = multer({
  storage: plottingStorage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 limit for  files
  },
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'svgfile', maxCount: 1 },
  { name: 'imagefile', maxCount: 1 },
]);
// -----------------------------------------------
// ---------------------building middleware
var buildingfileStorage = multer.memoryStorage({
  destination(req, file, cb) {
    cb(null, './my-uploads');
  },
});
const buildingUpload = multer({
  storage: buildingfileStorage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 limit for video files
  },
}).fields([
  { name: 'masterPlanLayout', maxCount: 1 },
  { name: 'towers' },
  { name: 'floors' },
  { name: 'flats' },
  { name: 'rooms' },
]);
// ----------------------------------------------------
const buildingUploadMiddleware = util.promisify(buildingUpload);
const plottingUploadMiddleware = util.promisify(plottingUpload);
var uploadFilesMiddleware = util.promisify(fileUpload);
var uploadVideosMiddleware = util.promisify(videoUpload);
var uploadPhotosMiddleware = util.promisify(imageUpload);

module.exports = {
  uploadFilesMiddleware,
  uploadPhotosMiddleware,
  uploadVideosMiddleware,
  buildingUploadMiddleware,
  plottingUploadMiddleware,
};
