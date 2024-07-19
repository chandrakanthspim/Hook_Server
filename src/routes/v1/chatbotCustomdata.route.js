const express = require('express');
const {
  updateCustomData,
  createCustomData,
  getCustomData,
  deleteCustomData,
} = require('../../controllers/chatBotCustomData.controller.js');
const auth = require('../../middlewares/auth.js');
// import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router
  .route('/customdata')
  .get(auth('getCustomData'), getCustomData)
  .post(auth('createCustomData'), createCustomData)
  .patch(auth('updateCustomData'), updateCustomData)
  .delete(auth('deleteCustomData'), deleteCustomData);
module.exports = router;
