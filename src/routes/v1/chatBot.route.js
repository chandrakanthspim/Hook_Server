const express = require('express');
const {intentMap}=require('../../services/chatBot.service')
const auth = require('../../middlewares/auth');
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');
const {chatbotFlowController}=require('../../controllers/chatBot.controller')
// import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();
router.post('/post',chatbotFlowController)

// router.post('/welcome', async(req,res,next)=>{
//     const { builderID } = req.query;
//     const { inputMessage, sessionID } = req.body;
//     try{
//     const result=await intentMap['Welcome Intent']({builderID, sessionID,inputMessage})
//     res.status(200).json(result);
//     }
//     catch(err){
//         console.log(err)
//         res.status(500).json({error:'Internal server error'})
//     }

// });
// router.post('/welcome/saveDetails', async(req,res,next)=>{
//     const { builderID } = req.query;
//     const { inputMessage, sessionID } = req.body;
//     try{
//     const result=await intentMap['Save Lead Intent']({builderID, sessionID,inputMessage})
//     res.status(200).json(result);
//     }
//     catch(err){
//         console.log(err)
//         res.status(500).json({error:'Internal server error'})
//     }

// });
// router.post('/change', async(req,res,next)=>{
//     const { builderID } = req.query;
//     const { inputMessage, sessionID } = req.body;
//     const types={'city':'city','property type':'propertyType','Property':'property'}
//     const type=types[inputMessage.substring(inputMessage.indexOf(' ')+1).trim()]
//     try{
//     const result= await intentMap['Change Intent']({builderID, sessionID,inputMessage,type})
//     res.status(200).json(result);
//     }
//     catch(err){
//         console.log(err)
//         res.status(500).json({error:'Internal server error'})
//     }

// });
// router.post('/select', async(req,res,next)=>{
//     const { builderID } = req.query;
//     const { inputMessage, sessionID ,type} = req.body;
//     // const types={'city':'city','property type':'propertyType','Property':'property'}
//     // const type=types[inputMessage.substring(inputMessage.indexOf(' ')+1).trim()]
//     try{
//     const result=await intentMap['Select Intent']({builderID, sessionID,inputMessage,type})
//     res.status(200).json(result);
//     }
//     catch(err){
//         console.log(err)
//         res.status(500).json({error:'Internal server error'})
//     }

// });
// router.post('/select/feature', async(req,res,next)=>{
//     const { builderID } = req.query;
//     const { inputMessage, sessionID } = req.body;
//     // const types={'city':'city','property type':'propertyType','Property':'property'}
//     // const type=types[inputMessage.substring(inputMessage.indexOf(' ')+1).trim()]
//     try{
//     const result=await intentMap['Select Feature Intent']({builderID, sessionID,inputMessage})
//     res.status(200).json(result);
//     }
//     catch(err){
//         console.log(err)
//         res.status(500).json({error:'Internal server error'})
//     }

// });


module.exports = router;
