const httpStatus = require('http-status');
const { Project, ChatbotCustomdata, Leads } = require('../models');
const ApiError = require('../utils/ApiError');
const { ChatbotSessionService, projectService, ChatbotCustomdataService, LeadsService } = require('./index');
const mongoose = require('mongoose');
// const Building = require("../models/availibility.model");

const SocketManager = require('./socket.service');
const manager = new SocketManager().getInstance();


const suggestions = [
  'highlights',
  'layout',
  'floorPlans',
  'status',
  'projectLocationMap',
  'virtualTour',
  'contactNumber',
  'completionYear',
  'videos',
  'gallery',
  'docs',
  'projectType',
];
const changeSuggestion = [
  { title: 'Change city', payload: 'change.city' },
  { title: 'Change property type', payload: 'change.propertyType' },
  { title: 'Change Property', payload: 'change.property' },
];

const suggestionsWithPayload = suggestions.map((suggestion) => ({ title: suggestion, payload: `select.feature` }));
suggestionsWithPayload.push({ title: 'End Conversation', payload: 'welcome.end' });
const requestCallBackSuggestion = { title: 'Request Callback', payload: 'welcome.requestCallBackInit' };

function isLeadCaptured(sessionData, chatbotCustomData, featureRequest) {

  if (chatbotCustomData.leadCaptureAt.includes(featureRequest) && sessionData.status == false) {
    return false;
  }
  return true;
}

async function welcome(initBody) {
  const { builderID, inputMessage, sessionId } = initBody;
  const customData = await ChatbotCustomdataService.getCustomDataByID(builderID);
  const uniqueCities = await Project.find({ createdBy: builderID }).distinct('city');

  let CustomWelcome = customData?.welcomeMessage || 'Hello! How may I help you today? Select a city to start with.';
  const locationDetails = {}; //await axios.get(`https://ipapi.co/${IP}/json/`);
  const country = 'India'; //locationDetails.data.country_name;
  const state = 'Telangana'; //locationDetails.data.region;
  const city = 'Hyderabad'; //locationDetails.data.city;
  //  const { city,country,state, priority, property, status, source, description, clientName, clientPhone } = test
  const sessionData = await ChatbotSessionService.getchatbotSessionById(sessionId)
  if (!sessionData) {
    await ChatbotSessionService.createSessionData({ city, country, state, sessionId, status: 'Initialized' });
  }
  return {
    data: {
      message: CustomWelcome,
      response: uniqueCities,
      action: 'select.city'
    },
    suggestions: [{ title: 'Change city', payload: 'change.city' }],
  };
}

async function saveLeadDetails(leadBody) {
  const { builderID, inputMessage, sessionId, type } = leadBody;
  const sessionData = await ChatbotSessionService.getchatbotSessionById(sessionId);

  if (!sessionData) {
    return {
      data: {
        message: 'No session found. Please restart the conversation.',
      },
      suggestions: changeSuggestion,
    };
  }
  if (sessionData.status != 'Initialized') {
    return {
      data: {
        message: 'Lead data already saved.',
      },
      suggestions: [...changeSuggestion, ...suggestionsWithPayload]
    };
  }
  await LeadsService.createLead({
    ...sessionData,
    clientPhone: inputMessage.phone,
    clientName: inputMessage.name,
    clientEmail: inputMessage.email,
    status: 'Collected',
  });
  const lastProjId = sessionData.propertiesVisited.slice(-1);
  const lastPRojectDetails = await projectService.getProjectById(lastProjId);
  return {
    data: {
      message: 'Successfully saved information.',
      response: lastPRojectDetails,
      action: 'select.feature'
    },
    suggestions: suggestionsWithPayload,
  };
}

async function changeFunction(changeBody) {
  const { builderID, inputMessage, sessionId, type } = changeBody;
  const sessionData = await ChatbotSessionService.getchatbotSessionById(sessionId);
  if (!builderID || !sessionData) {
    return {
      data: {
        message: 'No data found for session or builder',
        action: 'welcome.init'
      },
      suggestions: changeSuggestion
    };
  }
  switch (type) {
    case 'property':
      let city = sessionData.lastVisitedCity;
      let projectType = sessionData.lastVisitedProjectType;
      if (!city || !projectType) {
        return {
          data: {
            message: 'Please select a city and project type.',
            action: 'change.city'
          },
          suggestions: [...changeSuggestion, ...suggestionsWithPayload]
        };
      }
      const allProjects = await Project.find({ createdBy: builderID, city, projectType }, { title: 1 });
      return {
        data: {
          message: 'You chose to change ' + type,
          response: allProjects,
          action: 'select.property'
        },
        suggestions: [...changeSuggestion, ...suggestionsWithPayload]
      };
    case 'city':
      const uniqueCities = await Project.find({ createdBy: builderID }).distinct('city');
      return {
        data: {
          message: 'You chose to change ' + type,
          response: uniqueCities,
          action: 'select.city'
        },
        suggestions: [{ title: 'Change property type', payload: `change.propertyType` }],
      };
    case 'propertyType':
      const uniquePropertType = await Project.find({ createdBy: builderID }).distinct('projectType');
      return {
        data: {
          message: 'You chose to change ' + type,
          response: uniquePropertType,
          action: 'select.propertyType'
        },
        suggestions: changeSuggestion
      };
  }
}

async function selectFunction(selectBody) {
  const { builderID, inputMessage, sessionId, type } = selectBody;
  const sessionData = await ChatbotSessionService.getchatbotSessionById(sessionId);
  // console.log(sessionData,builderID)
  if (!builderID || !sessionData) {
    return {
      data: {
        message: 'No data found for session or builder',
        action: 'welcome.init'
      },
      suggestions: changeSuggestion
    };
  }
  // console.log(sessionData,typeof sessionData.citiesVisited);
  switch (type) {
    case 'property':
      const isExists = sessionData.propertiesVisited.includes(`${inputMessage}`);
      // console.log(isExists,sessionData.propertiesVisited,inputMessage)
      if (!isExists) {
        sessionData.propertiesVisited.push(`${inputMessage}`);
      }
      sessionData.lastVisitedProperty = `${inputMessage}`
      // console.log(sessionData)
      await sessionData.save();
      let propertyForProperty = await projectService.getProjectById(inputMessage);
      return {
        data: {
          message: 'You chose ' + type,
          response: propertyForProperty,
          action: 'select.feature'
        },
        suggestions: [...changeSuggestion, ...suggestionsWithPayload, requestCallBackSuggestion]
      };
    case 'city':
      const isCityExists = sessionData.citiesVisited.includes(inputMessage);
      if (!isCityExists) {
        sessionData.citiesVisited.push(inputMessage);
      }
      sessionData.lastVisitedCity = inputMessage;
      await sessionData.save();
      // let property= await projectService.getProjectById(inputMessage)
      const uniquePropertType = await Project.find({ createdBy: builderID }).distinct('projectType');
      return {
        data: {
          message: `You chose ${type}. Select type of property`,
          response: uniquePropertType,
          action: 'select.propertyType'
        },
        suggestions: [{ title: 'Change property type', payload: `change.propertyType` }],
      };
    case 'propertyType':
      sessionData.lastVisitedProjectType = inputMessage;
      await sessionData.save();
      let tempProperty = await Project.find(
        { createdBy: builderID, city: sessionData.lastVisitedCity, projectType: inputMessage },
        { title: 1 }
      ).lean();
      return {
        data: {
          message: `You chose ${type}. Select type of property`,
          response: tempProperty,
          action: 'select.property'
        },
        suggestions: changeSuggestion,
      };
    default:
      return {
        data: {
          message: `Coudn't find anything :(`,
          action: 'welcome.fallback'
        },
        suggestions: [...changeSuggestion, ...suggestionsWithPayload]
      };
  }
}

async function selectProjectFeature(featureBody) {
  const { builderID, inputMessage, sessionId, type } = featureBody;
  const sessionData = await ChatbotSessionService.getchatbotSessionById(sessionId);
  const customData = await ChatbotCustomdataService.getCustomDataByID(builderID);

  if (!sessionData) {
    return {
      data: {
        message: `Session not available. Refresh the conversation.`,
      },
      suggestions: [],
    };
  }

  if (isLeadCaptured(sessionData, customData, inputMessage)) {
    return {
      data: {
        message: 'Before we proceed, may I know few details?',
        action: 'welcome.saveLead'
      },
      suggestions: changeSuggestion,
    };
  }
  if (!sessionData.lastVisitedProperty) {
    return {
      data: {
        message: 'Select a property before getting the feature.',
      },
      suggestions: [...changeSuggestion, ...suggestionsWithPayload]
    };
  }
  const features = [
    'highlights',
    'layout',
    'floorPlans',
    'status',
    'projectLocationMap',
    'virtualTour',
    'contactNumber',
    'completionYear',
    'videos',
    'gallery',
    'docs',
    'projectType',
  ];
  const property = await projectService.getProjectById(sessionData.lastVisitedProperty);
  if (!features.includes(inputMessage)) {
    return {
      data: {
        message: `Coudn't find project Feature :(`,
        action: 'welome.fallback'
      },
      suggestions: [...changeSuggestion, ...suggestionsWithPayload]
    };
  }
  switch (inputMessage) {
    case inputMessage:
      return {
        data: {
          message: `You chose ${inputMessage} for property`,
          response: property[inputMessage] || 'Currently not available',
          action: 'select.feature'
        },
        suggestions: [...changeSuggestion, ...suggestionsWithPayload, requestCallBackSuggestion]
      };
  }
}

function fallback() {

  return {
    data: {
      message: "Sorry, I didn't get that.",
    },
    suggestions: [...changeSuggestion, ...suggestionsWithPayload]
  };
}

function endConversation() {

  return {
    data: {
      message: "I hope I was able to assist you. If you need anything else, feel free to reach out. Goodbye!",
      action: 'welcome.init'
    },
    suggestions: [{ title: 'Restart conversation', payload: 'welcome.init' }],
  };
}

async function requestCallbackInit(requestBody) {
  const { builderID, inputMessage, sessionId, type } = requestBody;
  const sessionData = await ChatbotSessionService.getchatbotSessionById(sessionId);
  if (!builderID || !sessionData) {
    return {
      data: {
        message: 'No data found for session or builder',
        action: 'welcome.init'
      },
      suggestions: changeSuggestion
    };
  }
  const allProjects = await Project.find({ createdBy: builderID }, { title: 1 });
  const propertiesVisited = sessionData.propertiesVisited
  const visitedProjects = allProjects.filter(project => propertiesVisited.includes(project._id))
  let arrLen = visitedProjects.length
  return {
    data: {
      message: `Select the project${arrLen > 1 && 's'} you want a callback for and add an optional message of your requirement. `,
      response: visitedProjects || 'Currently not available',
      action: 'welcome.requestCallBack'
    },
    suggestions: [{ title: 'End Conversation', payload: 'welcome.end' }]
  };

}

async function requestCallback(requestBody) {
  const { builderID, inputMessage, sessionId, type } = requestBody;
  const sessionData = await ChatbotSessionService.getchatbotSessionById(sessionId);
  if (!builderID || !sessionData) {
    return {
      data: {
        message: 'No data found for session or builder',
        action: 'welcome.init'
      },
      suggestions: changeSuggestion
    };
  }
  const projectsReqForCallback = inputMessage.projects.map(id => new mongoose.Types.ObjectId(id))
  const detailsOfAgents = await Project.find({
    _id: {
      $in: projectsReqForCallback
    }
  }, { assignedEmployees: 1 }).populate('assignedEmployees', 'contactNumber email');

  console.log(projectsReqForCallback, detailsOfAgents)

  return {
    data: {
      message: `Your request has been sent. An agent will contact you shortly.`,
      response: [] || 'Currently not available',
      action: 'welcome.end'
    },
    suggestions: [{ title: 'End Conversation', payload: 'welcome.end' }]
  };

}

async function agentHandOffInit(handOffBody) {

  const { builderID, inputMessage, sessionId, type } = handOffBody;
  const sessionData = await ChatbotSessionService.getchatbotSessionById(sessionId);
  if (!builderID || !sessionData) {
    return {
      data: {
        message: 'No data found for session or builder',
        action: 'welcome.init'
      },
      suggestions: changeSuggestion
    };
  }
  const allProjects = await Project.find({ createdBy: builderID }, { title: 1 });
  const propertiesVisited = sessionData.propertiesVisited
  const visitedProjects = allProjects.filter(project => propertiesVisited.includes(project._id))
  let arrLen = visitedProjects.length
  return {
    data: {
      message: `Select the project for which you want to talk to agent to.`,
      response: visitedProjects || 'Currently not available',
      action: 'welcome.agentHandOff'
    },
    suggestions: [{ title: 'End Conversation', payload: 'welcome.end' }]
  };
}

async function agentHandOff(handOffBody) {

  const { projectId, sessionId } = handOffBody.projectId;
  const userId = Math.round(Math.random() * 1000000)
  manager.requestForHandOff({ projectId, roomId: sessionId, userId })

  //notifying agent logic 

  return {
    data: {
      message: `Agents have been notified. Please wait for a bit till they connect! `,
      response: { userId, username: `visitor_${userId}`, roomId: sessionId },
      action: 'welcome.end'
    },
    suggestions: [requestCallBackSuggestion]
  };

}
const intentMap = {
  'Welcome Intent': welcome,
  'Change Intent': changeFunction,
  'Select Intent': selectFunction,
  'Select Feature Intent': selectProjectFeature,
  'Save Lead Intent': saveLeadDetails,
  'Fallback Intent': fallback,
  'End Intent': endConversation,
  'Request CallBack Init Intent': requestCallbackInit,
  'Request CallBack Intent': requestCallback,
  'Agent Handoff Init Intent': agentHandOffInit,
  'Agent Handoff Intent': agentHandOff,
};
// const intentMap=new Map();
//   intentMap.set('Welcome Intent', welcome);
//   intentMap.set('Change Intent', changeFunction);
//   intentMap.set('Select Intent', selectFunction);
//   intentMap.set('Select Feature Intent', selectProjectFeature);
//   intentMap.set('Save Lead Intent',saveLeadDetails)
//   intentMap.set('Fallback Intent',fallback)

module.exports = { intentMap };
