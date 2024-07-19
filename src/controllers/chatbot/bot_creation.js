const Joi = require('joi');

const { attributes } = require('./bot_constants');
const { DynamicMessages } = require('../../models/chatbot/dynamicMessages.model');
const { DialogueFlows } = require('../../models/chatbot/dialogueFlow.model');
const { ClientChatBots } = require('../../models/chatbot/clientChatBots.model');

// fetch the dynamic messages
const fetchDynamicMessages = async (botId) => {
  const result = {
    success: true,
    message: '',
    data: [],
  };

  try {
    // fetch the messages with botId
    result.data = await DynamicMessages.find({ botId });
    result.message = 'Messages fetched successfully!';
  } catch (error) {
    console.log('Unable to fetch the messages');
    result.success = false;
    result.message = 'Unable to fetch the messages!';
  }
  return result;
};

// create the dynamic messages
const createDynamicMessages = async (body) => {
  const result = {
    success: true,
    message: '',
    data: [],
  };

  try {
    const schema = Joi.object({
      builderId: Joi.string().required(),
      botId: Joi.string().required(),
      message: Joi.string().required().min(2).max(2000),
      messageType: Joi.number().required(),
    });

    const value = await schema.validateAsync(body);

    // insert/update the messages with botId
    const data = new DynamicMessages({
      builderId: value.builderId,
      botId: value.botId,
      message: value.message,
      messageType: value.messageType,
      status: 1,
    });

    const insertResponse = await data.save();
    result.data = insertResponse;
    result.message = 'Message added successfully!';
  } catch (error) {
    console.log('Unable to process the messages', error);
    result.success = false;
    result.message = 'Unable to process the messages!';
  }
  return result;
};

// fetch the bot attributes used for dialogue flow creation
const fetchBotAttributes = (request, response) => {
  const result = {
    success: true,
    message: '',
    data: [],
  };

  try {
    result.data = attributes;
    result.message = 'Attributes fetched successfully!';
  } catch (error) {
    console.log('Unable to get the attributes');
    result.success = false;
    result.message = 'Unable to get the attributes!';
  }
  return result;
};

// fetching the dialoue flow of a bot
const fetchDialogueFlow = async (botId) => {
  const result = {
    success: true,
    message: '',
    data: [],
  };

  try {
    // fetch the dialogue flows of a chat bot
    result.data = await DialogueFlows.find({ botId });
    result.message = 'Dialogue flows fetched successfully!';
  } catch (error) {
    result.message = 'Unable to fetch the dialogue flow';
    console.log(result.message, error);
    result.success = false;
  }

  return result;
};

// fetch complete bot details
const fetchBotDetails = async (botId) => {
  const result = {
    success: true,
    message: '',
    data: {},
  };

  try {
    // fetch the bot complete details
    result.data = await ClientChatBots.findById({ _id: botId });
    const botDialogueFlow = await fetchDialogueFlow(botId);
    console.log('Bot details', result.data, '\nDialogue flow', botDialogueFlow);
    result.success = 'Bot details fetched successfully!';
  } catch (error) {
    console.log('Unable to fetch the bot details');
    result.success = false;
    result.message = 'Unable to fetch the bot details';
  }
  return result;
};

// create a bot for builder/agency while onboarding
const createBot = async (body) => {
  const result = {
    success: true,
    message: '',
    data: [],
  };

  try {
    // create a new bot
    const schema = Joi.object({
      builderId: Joi.string().required(),
      botName: Joi.string().required(),
    });

    const value = await schema.validateAsync(body);

    // insert/update the messages with botId
    const data = new ClientChatBots({
      builderId: value.builderId,
      name: body.botName,
      status: 1,
    });

    const insertResponse = await data.save();
    console.log(insertResponse);
    result.data = insertResponse;
    result.message = 'Bot created for the builder!';
  } catch (error) {
    result.message = 'Unable to create bot!';
    console.log(result.message);
    result.success = false;
  }
  return result;
};

// configure the dialogue flow fot bot
const configureBot = async (body) => {
  const result = {
    success: true,
    message: '',
    data: [],
  };

  try {
    // update the bot configurations

    const schema = Joi.object({
      builderId: Joi.string().required(),
      botId: Joi.string().required(),
      messageId: Joi.string().required(),
      // messageId: Joi.string().when(Joi.ref('message'), {
      //   is: Joi.valid(null, ''),
      //   then: Joi.required(),
      //   otherwise: Joi.optional(),
      // }),
      // message: Joi.string().when(Joi.ref('messageId'), {
      //   is: Joi.valid(null, ''),
      //   then: Joi.required(),
      //   otherwise: Joi.optional(),
      // }),
      attributeCode: Joi.string().required(),
      level: Joi.number().required(),
      // dialogueId: Joi.string().optional(),
    });

    const value = await schema.validateAsync(body);
    console.log('validation');

    let { messageId } = value;

    // create the dynamic message
    if (!messageId) {
      console.log('creating a new message');
      const messageDetails = await createDynamicMessages({
        builderId: body.builderId,
        botId: body.botId,
        message: body.message,
        messageType: 2,
      });
      messageId = messageDetails.data._id;
    }

    // insert/update the messages with botId
    const data = new DialogueFlows({
      builderId: value.builderId,
      botId: value.botId,
      messageId,
      attributeCode: body.attributeCode,
      level: body.level,
      status: 1,
    });
    console.log('new data', data);
    const insertResponse = await data.save();
    console.log('flow configured', insertResponse);
  } catch (error) {
    console.log('Unable to configure bot!', error);
    result.success = false;
    result.message = 'Unable to configure bot!';
  }
  return result;
};

// delete a dialogue
const deleteDialogue = async (body) => {
  const result = {
    success: true,
    message: '',
  };

  try {
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const value = await schema.validateAsync(body);

    await DialogueFlows.deleteOne({ _id: value.id });
    result.message = 'Dialogue deleted successfully!';
  } catch (error) {
    result.message = 'Unable to delete the dialogue!';
    result.success = false;
    console.log(result.message);
  }
  return result;
};

module.exports = {
  deleteDialogue,
  configureBot,
  fetchBotDetails,
  createBot,
  fetchBotAttributes,
  createDynamicMessages,
  fetchDialogueFlow,
};
