const express = require('express');
const leadsController = require('../../controllers/leads.controller');

const auth = require('../../middlewares/auth');

const router = express.Router();

// GET
router.get('/get/single/:leadId', auth(), leadsController.getLead);
router.get('/get/phone/:phone', auth(), leadsController.getLeadByPhone);
router.get('/get/employee', auth(), leadsController.getEmployeeLeads);
router.get('/get/all', auth(), leadsController.getLeads);
// router.get('/get/all', auth(), leadsController.getLeads);
router.get('/get/stats', auth(), leadsController.getLeadsStat);
router.get('/search', auth(), leadsController.searchLead);
router.get('/filter', auth(), leadsController.filterLead);

// POST
router.post('/create', auth(), leadsController.createLead);

// PUT
router.put('/archive', auth(), leadsController.archiveLead);
router.put('/update/:leadId', auth(), leadsController.updateLead);
router.put('/update/shift/:leadId', auth(), leadsController.shiftLead);
router.put('/update/share/:leadId', auth(), leadsController.shareLead);

// DELETE
router.delete('/delete/:leadId', auth('manageleads'), leadsController.deleteLead);
router.delete('/delete-whole-collection', auth('manageleads'), leadsController.deleteWholeCollection);

module.exports = router;
