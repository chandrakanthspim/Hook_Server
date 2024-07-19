const { ClientChatBots, DialogueFlows, DynamicMessages } = require('../../../models');

// fetching the bot details
const fetchBotDetails = async (botId, builderId) => {
  const result = {
    success: true,
    message: '',
    data: {},
  };

  try {
    const query = ClientChatBots.find();
    if (botId) {
      query.where('_id', botId).where('status', 1);
    } else {
      query.where('builderId', builderId);
    }

    const details = await query;
    console.log('bot details: \t', details);
    result.data = details;
    result.message = 'Bot details fetched successfully!';
  } catch (error) {
    result.message = 'Exception while fetching the bot details';
    result.success = false;
    console.log(result.message, ': \n', error);
  }
  return result;
};

// fetching the specific level dialogue flow details of the bot
const getBotDialogueLevel = async (botId, level) => {
  const result = {
    success: true,
    message: '',
    data: {},
  };

  try {
    const details = await DialogueFlows.findOne({ botId, level, status: 1 });
    console.log('dialogueflow details: \t', details);
    result.data = details;
    result.message = 'Bot dialogueflow details fetched successfully!';
  } catch (error) {
    result.message = 'Exception while fetching the bot dialogueflow details';
    result.success = false;
    console.log(result.message, ':\n', error);
  }
  return result;
};

// fetch the bot welcome message
const fetchWelcomeMessage = async (botId, messageId = null) => {
  const result = {
    success: true,
    message: '',
    data: {},
  };

  try {
    const query = DynamicMessages.findOne({ botId, status: 1 });

    if (messageId) {
      query.where('_id', messageId);
    }
    const details = await query;

    console.log('welcome messages details: \t', details, botId);
    result.data = details;
    result.message = 'Bot message fetched successfully!';
  } catch (error) {
    result.message = 'Exception while fetching the bot message';
    result.success = false;
    console.log(result.message, ':\n', error);
  }
  return result;
};

module.exports = {
  fetchBotDetails,
  getBotDialogueLevel,
  fetchWelcomeMessage,
};
