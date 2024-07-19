const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { leadsController } = require('../../controllers');
const { leadValidation } = require('../../validations');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const router = express.Router();

router.route('/post-lead').post(validate(leadValidation.createLeads), leadsController.createLeads);

router.route('/:leadId')
    .get(auth("getLead"), validate(leadValidation.getLead), checkUserStatusMiddleware, leadsController.getLead)
    .patch(auth("updateLead"), validate(leadValidation.updateLead), checkUserStatusMiddleware, leadsController.updateLead)
    .delete(auth("deleteLead"), validate(leadValidation.deleteLead), checkUserStatusMiddleware, leadsController.deleteLead);

//additional if want
router.route('/user/leads-data')
    .get(auth("getBuilderLeads"), checkUserStatusMiddleware, leadsController.getBuilderLeads)
    .delete(auth("deleteBuilderLeads"), checkUserStatusMiddleware, leadsController.deleteAllLeadsByBuilder);

router.route('/project-leads/:projectId')
    .get(auth("getProjectLeads"), validate(leadValidation.getProjectLeads), checkUserStatusMiddleware, leadsController.getProjectLeads);

router.route('/project-stats/:projectId')
    .get(auth("getProjectLeadsStats"), validate(leadValidation.intervalsValidate), checkUserStatusMiddleware, leadsController.getLeadStats);

router.route('/employee-leads')
    .get(auth("getEmployeeLeads"), checkUserStatusMiddleware, leadsController.getEmployeeLeads);

module.exports = router;