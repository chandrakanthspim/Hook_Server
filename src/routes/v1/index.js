const express = require('express');
// const authRoute = require('./auth.route');
// const userRoute = require('./user.route');
const subscriptionRoute = require('./subscription.route');
const imageRoute = require('./image.route');
const docsRoute = require('./docs.route');
const config = require('../../config/config');
const buildingRoute = require('./building.route');
const chatRoute = require('./chat.route');
const chatBotRoute = require('./chatBot.route');

const customChatbotRoute = require('./chatbotCustomdata.route');

//jayant added routes
const adminAuthRoute = require('./admin.auth.route');
const builderAuthRoute = require('./builder.auth.route');
const agentAuthRoute = require('./agent.auth.route');
const employeeAuthRoute = require('./employee.auth.route');
const planRoute = require('./plan.route');
const adminRoute = require('./admin.route');
const builderRoute = require('./builder.route');
const agentRoute = require('./agent.route');
const employeeRoute = require('./employee.route');
const projectRoute = require('./project.route');
const categoryRoute = require('./category.route');
const countryRoute = require('./country.route');
const stateRoute = require('./states.route');
const cityRoute = require('./city.route');
const plottingRoute = require('./plotting.route');
const apartmentRoute = require('./apartment.route');
const towerRoute = require('./tower.route');
const floorRoute = require('./floor.route');
const flatRoute = require('./flat.route');
const leadsRoute = require('./lead.route');

// chatbot
const botRouter = require('./chatbot/chatbot.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/admin-auth',
    route: adminAuthRoute,
  },
  {
    path: '/auth',
    route: [builderAuthRoute, agentAuthRoute, employeeAuthRoute],
  },
  {
    path: '/admin',
    route: [adminRoute, planRoute, countryRoute, stateRoute, cityRoute, categoryRoute],
  },
  {
    path: '/builder',
    route: builderRoute,
  },
  {
    path: '/builder/chatbot',
    route: customChatbotRoute,
  },
  {
    path: '/agent',
    route: agentRoute,
  },
  {
    path: '/employee',
    route: employeeRoute,
  },
  {
    path: '/builder/project',
    route: projectRoute,
  },
  {
    path: '/agent/project',
    route: projectRoute,
  },
  {
    path: '/images',
    route: imageRoute,
  },
  {
    path: '/leads',
    route: leadsRoute,
  },
  {
    path: '/availibility',
    route: [plottingRoute, apartmentRoute, towerRoute, floorRoute, flatRoute],
  },
  {
    path: '/building',
    route: buildingRoute,
  },
  {
    path: '/chatbotFlow',
    route: chatBotRoute,
  },
  {
    path: '/subscription',
    route: subscriptionRoute,
  },
  {
    path: '/chat',
    route: chatRoute,
  },
  {
    path: '/bot',
    route: botRouter,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
  // console.log('yeah', route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}
const multer = require('multer');
const util = require('util');
const fs = require('fs');
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');
var fileStorage = multer.memoryStorage({
  destination(req, file, cb) {
    cb(null, './my-uploads');
  },
  // filename: function (req, file, cb) {
  //   cb(null, `${Date.now()}-spim-${file.originalname}`);
  // },
});
const fileUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 limit for video files
  },
}).fields([{ name: 'towers' }, { name: 'floors' }, { name: 'flats' }, { name: 'rooms' }]);
const fileUploadMiddleware = util.promisify(fileUpload);
router.route('/upload').post(fileUploadMiddleware, async (req, res, next) => {
  try {
    let files = req.files;
    let data = {
      towers: [],
      floors: [],
      flats: [],
      rooms: [],
    };
    const metadata = JSON.parse(req.body.metadata);
    // console.log(metadata);
    if (files) {
      for (let f of Object.entries(files)) {
        data[f[0]] = [];
        for (let x of f[1]) {
          let tempdata = {};
          let metaElement = metadata.find((ele) => x.originalname === ele.filename);
          // console.log(metadata[ind], ind, x.originalname);
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
          tempdata['filename'] = `${Date.now()}-spim-${x.originalname}`;
          data[f[0]].push(tempdata);
        }
      }
    }
    // console.log(files);
    res.send({ data });

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
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload files');
  }
});

module.exports = router;
