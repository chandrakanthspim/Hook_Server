const express = require('express');
const auth = require('../../middlewares/auth');
const plottingController = require('../../controllers/plotting.controller');
const { plottingUploads } = require('../../utils/constants');
const router = express.Router();

router
  .route('/plot/:projectId')
  .post(auth("createPlotting"), plottingUploads, plottingController.createPlotting)
  .patch(auth("updatePlotting"), plottingUploads, plottingController.updatePlotting)
  .delete(auth("deletePlotting"), plottingController.deletePlotting)

  router.route('/get-plots').get(auth('getBuilderPlotting'), plottingController.getBuildersPlotting);

router
  .route('/plot/:projectId')
  .get(plottingController.getPlotting)

module.exports = router;
