const express = require('express');
const { getMessages, sendMessage, getAllConversationsForUser } = require('../../controllers/message.controller.js');
const auth = require('../../middlewares/auth');
// import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get('/getAllChats', auth(), getAllConversationsForUser);
router.get('/get/:id', auth(), getMessages);
router.post('/send/:id', auth(), sendMessage);

module.exports = router;
