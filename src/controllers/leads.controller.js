const { LeadsService } = require('../services');

const getLead = async (req, res, next) => {
  const Lead = await LeadsService.getLead(req);
  res.send(Lead);
};

const getLeads = async (req, res, next) => {
  const allLeads = await LeadsService.getLeads(req);
  res.send(allLeads);
};

const getLeadByPhone = async (req, res, next) => {
  const Lead = LeadsService.getLeadByPhone(req.params.phone);
  res.send(Lead);
};

const getEmployeeLeads = async (req, res, next) => {
  const employeeLeads = await LeadsService.getEmployeeLeads(req);
  res.send(employeeLeads);
};

const getLeadsStat = async (req, res, next) => {
  const stats = await LeadsService.getLeadsStat(req);
  res.send(stats);
};

const searchLead = async (req, res, next) => {
  const lead = await LeadsService.searchLead(req);
  res.send(lead);
};

const filterLead = async (req, res, next) => {
  const filteredLead = await LeadsService.filterLead(req);
  res.send(filteredLead);
};

const createLead = async (req, res, next) => {
  const createdLead = await LeadsService.createLead(req.body);
  res.send(createdLead);
};

const updateLead = async (req, res, next) => {
  const updatedLead = await LeadsService.updateLead(req.body);
  res.send(updatedLead);
};

const shiftLead = async (req, res, next) => {
  const shiftedLead = await LeadsService.shiftLead(req);
  res.send(shiftedLead);
};

const shareLead = async (req, res, next) => {
  const lead = await LeadsService.shareLead(req);
  res.send(lead);
};

const archiveLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const result = await Lead.findByIdAndUpdate(leadId, { $set: { isArchived: true } }, { new: true });
    res.status(200).json({ result, message: 'Lead archived successfully', success: true });
  } catch (err) {
    next(createError(500, err.message));
  }
};

const deleteLead = async (req, res, next) => {
  const deletedLead = await LeadsService.deleteLead(req);
  res.send(deletedLead);
};

const deleteWholeCollection = async (req, res, next) => {
  const allDeletedLeads = await LeadsService.deleteWholeCollection(req);
  res.send(allDeletedLeads);
};

module.exports = {
  getLead,
  getLeads,
  getLeadByPhone,
  getLeadsStat,
  getEmployeeLeads,
  shiftLead,
  shareLead,
  archiveLead,
  deleteLead,
  deleteWholeCollection,
  filterLead,
  createLead,
  searchLead,
  updateLead,
};
