const { intentMap } = require('../services/chatBot.service')
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const switchIntentMap = {
    'select': 'Select Intent',
    'change': 'Change Intent',
    'feature': 'Select Feature Intent',
    'init': 'Welcome Intent',
    'saveLead': 'Save Lead Intent',
    'fallback': 'Fallback Intent',
    'end': 'End Intent',
    'requestCallBackInit': 'Request CallBack Init Intent',
    'requestCallBack': 'Request CallBack Intent',
    'agentHandOff': 'Agent HandOff Intent',
    'agentHandOffInit': 'Agent HandOff Init Intent'
}

const chatbotFlowController = async (req, res, next) => {
    const { builderID } = req.query;
    const { inputMessage, sessionId, action } = req.body;
    let result = undefined;
    try {
        const [switchIntent, typeForAction] = action.split('.')
        switch (switchIntent) {
            case 'select':
                if (typeForAction == 'feature') {
                    result = await intentMap[switchIntentMap['feature']]({ builderID, sessionId, inputMessage, type: typeForAction })
                } else {
                    result = await intentMap[switchIntentMap['select']]({ builderID, sessionId, inputMessage, type: typeForAction })
                }
                break;
            case 'change':
                result = await intentMap[switchIntentMap['change']]({ builderID, sessionId, inputMessage, type: typeForAction })

                break;
            case 'welcome':
                switch (typeForAction) {
                    case 'init':
                        result = await intentMap[switchIntentMap['init']]({ builderID, sessionId, inputMessage })
                        break;
                    case 'saveLead':
                        result = await intentMap[switchIntentMap['saveLead']]({ builderID, sessionId, inputMessage })
                        break;
                    case 'end':
                        result = await intentMap[switchIntentMap['end']]({ builderID, sessionId, inputMessage })
                        break;
                    case 'fallback':
                        result = await intentMap[switchIntentMap['fallback']]({ builderID, sessionId, inputMessage })
                        break;
                    case 'requestCallBackInit':
                        result = await intentMap[switchIntentMap['requestCallBackInit']]({ builderID, sessionId, inputMessage })
                        break;
                    case 'requestCallBack':
                        result = await intentMap[switchIntentMap['requestCallBack']]({ builderID, sessionId, inputMessage })
                        break;
                    case 'agentHandOff':
                        result = await intentMap[switchIntentMap['agentHandOff']]({ builderID, sessionId, inputMessage })
                    case 'agentHandOffInit':
                        result = await intentMap[switchIntentMap['agentHandOffInit']]({ builderID, sessionId, inputMessage })
                    default:
                        throw new ApiError(httpStatus.NOT_FOUND, 'Unknown action')
                }
                break;

            default:
                throw new ApiError(httpStatus.NOT_FOUND, 'Unknown action')
        }
        res.status(200).json(result);
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Internal server error' })
    }
}
module.exports = {
    chatbotFlowController
};
