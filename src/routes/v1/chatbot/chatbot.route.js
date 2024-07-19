const { Router } = require('express');
const joi = require('joi');
const { attributes } = require('../../../controllers/chatbot/bot_constants');
const {
  configureBot,
  createBot,
  createDynamicMessages,
  fetchBotAttributes,
  fetchBotDetails,
  fetchDynamicMessages,
} = require('../../../controllers/chatbot/bot_creation');

const botRouter = Router();
// console.log('some logs');

// botRouter.route('').get((response) => {
//   response.send('hi');
// });

// config the custom messages
botRouter.get('/messages', async (request, response) => {
  const { botId } = request.body;
  const data = await fetchDynamicMessages(botId);
  response.send(data);
});

// create or update the messages
botRouter.post('/configure_messages', async (request, response) => {
  const data = await createDynamicMessages(request.body);
  response.send(data);
});

// fetching the attributes for chatbot dynamic dialogue flow
botRouter.get('/attributes', async (request, response) => {
  const data = await fetchBotAttributes();
  response.send(data);
});

// fetch bot details
botRouter.get('/details', async (request, response) => {
  const { botId } = request.body;
  const data = await fetchBotDetails(botId);
  response.send(data);
});

// if incase the bot is unable to create while onboarding, we can provide a manual creation of bot
botRouter.post('/create', async (request, response) => {
  const data = await createBot(request.body);
  response.send(data);
});

// configure the bot for builder/agnecy
botRouter.post('/configure', async (request, response) => {
  const { body } = request;
  const data = await configureBot(body);
  response.send(data);
});

module.exports = botRouter;
