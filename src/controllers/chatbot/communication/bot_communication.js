const { Socket } = require('socket.io');
const { fetchWelcomeMessage, getBotDialogueLevel } = require('../../../services/chatbot/communication/botDetails.service');
const {
  retrieveProjectsLocation,
  retriveProjectCategory,
  retrieveProjects,
  retrieveCategoriesByCity,
  retrieveProjectsLocationByCategory,
  retrieveProjectsByCity,
  retrieveProject,
} = require('../../../services/shared.service');

// fetching the attributes list
const getAttributeDetails = async (configDetails) => {
  const { attributeCode, builderId, locationId, categoryId, projectId } = configDetails;
  let attributes = {};
  console.log('this is atribute', attributeCode);

  switch (attributeCode) {
    case 'location':
      console.log('in location');
      attributes = await retrieveProjectsLocation(builderId, categoryId);
      break;

    case 'category':
      console.log('in category');

      attributes = await retriveProjectCategory(builderId, locationId);
      break;

    case 'project':
      console.log('in project');

      attributes = await retrieveProjects(builderId, categoryId, locationId);
      break;

    case 'builder':
      // fetch builders under agents
      break;

    default:
      // default projects
      console.log('in default');

      attributes = await retrieveProjects(builderId);
      break;
  }

  // console.log('attributes list', attributes.data);
  return attributes;
};

/**
 *
 * @param {Socket} socket
 */
const sendWelcomeMessages = async (socket, botId, event) => {
  try {
    // fetch welcome messages of a bot
    const messageDetails = await fetchWelcomeMessage(botId);
    console.log(messageDetails);
    if (messageDetails && messageDetails.success) {
      // fetch bot initial dialogue flow
      const dialogue = await getBotDialogueLevel(botId, 1);

      if (dialogue && dialogue.success) {
        let attributeDetails = {};
        const configDetails = {
          attributeCode: dialogue.data.attributeCode,
          builderId: messageDetails.data.builderId,
        };

        attributeDetails = await getAttributeDetails(configDetails);

        const newMessage = {
          name: 'Hook Bot',
          id: Math.random(),
          builderId: messageDetails.data.builderId,
          botId: messageDetails.data.botId,
          attributeCode: dialogue.data.attributeCode,
          attributeDetails: attributeDetails.data,
          message: messageDetails.data.message,
          messageType: messageDetails.data.messageType,
          level: 1,
        };

        socket.emit(event, {
          message: newMessage,
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const getNextMessages = async (socket, event, details) => {
  const { level, botId, locationId, categoryId, projectId, attributeCode } = details.message;
  try {
    let attributeDetails = {};

    if (attributeCode === 'project') {
      attributeDetails = await retrieveProject(projectId);

      const dialogue = await getBotDialogueLevel(botId, 0);

      const messageDetails = await fetchWelcomeMessage(botId, dialogue.data.messageId);
      if (messageDetails && messageDetails.success) {
        const newMessage = {
          id: Math.random(),
          botId,
          attributeCode: 'final',
          attributeDetails: attributeDetails.data,
          message: messageDetails.data.message,
          messageType: messageDetails.data.messageType,
        };

        socket.emit(event, {
          message: newMessage,
        });
      }
    } else {
      // fetch the dialogue flow next level
      const dialogue = await getBotDialogueLevel(botId, level + 1);

      // fetch welcome messages of a bot
      const messageDetails = await fetchWelcomeMessage(botId, dialogue.data.messageId);
      if (messageDetails && messageDetails.success) {
        const { builderId } = messageDetails.data;
        const configuration = {
          builderId,
          botId,
          locationId,
          categoryId,
          projectId,
          attributeCode: dialogue.data.attributeCode,
        };

        // fetch the next level details
        attributeDetails = await getAttributeDetails(configuration);

        const newMessage = {
          id: Math.random(),
          builderId,
          botId,
          attributeCode: dialogue.data.attributeCode,
          attributeDetails: attributeDetails.data,
          message: messageDetails.data.message,
          messageType: messageDetails.data.messageType,
          level: dialogue.data.level,
        };

        socket.emit(event, {
          message: newMessage,
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const getFinalProjectDetails = (projectId) => {};

module.exports = {
  sendWelcomeMessages,
  getAttributeDetails,
  getNextMessages,
};
