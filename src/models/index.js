const { ClientChatBots } = require('./chatbot/clientChatBots.model');
const { DialogueFlows } = require('./chatbot/dialogueFlow.model');
const { DynamicMessages } = require('./chatbot/dynamicMessages.model');

module.exports.Token = require('./token.model');
module.exports.User = require('./user.model');
module.exports.Project = require('./project.model');
module.exports.Subscription = require('./subscription.model');
module.exports.Plotting = require('./plotting.model');
module.exports.Apartment = require('./apartment.model');
module.exports.Tower = require('./tower.model');
module.exports.Floor = require('./floor.model');
module.exports.Flat = require('./flat.model');
module.exports.Building = require('./building.model');
module.exports.Leads = require('./leads.model');

//chat models
module.exports.Conversation = require('./conversation.model');
module.exports.Message = require('./message.model');


//customization data
module.exports.ChatbotCustomData =require('./chatbotCustomData.model');
module.exports.ChatbotSession=require('./chatbotSession.model')
module.exports.Request=require('./livechatRequests.model')


module.exports.Admin = require('./admin.model');
module.exports.Builder = require('./builder.model');
module.exports.Employee = require('./employee.model');
module.exports.Plan = require('./plan.model');
module.exports.City = require('./city.model');
module.exports.State = require('./state.model');
module.exports.Country = require('./country.model');
module.exports.Category = require('./category.model');
module.exports.Lead=require('./lead.model')

// chatbot
module.exports.ClientChatBots = ClientChatBots;
module.exports.DialogueFlows = DialogueFlows;
module.exports.DynamicMessages = DynamicMessages;
