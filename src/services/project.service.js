const httpStatus = require('http-status');
const { Project } = require('../models');
const ApiError = require('../utils/ApiError');

const createProject = async (projectBody) => {
  return Project.create(projectBody);
};

const getProjectById = async (id, builderId) => {
  const desiredFields = 'title description price contactNumber category approval location images area amenities facing city state country pincode highlights layout floorPlans locationMap virtualTour completionYear videos gallery status createdBy docs address'
  const project = await Project.findOne({ _id: id, createdBy: builderId }).select(desiredFields)
    .populate('createdBy', 'fullName contactNumber')
    .populate('assignedEmployees', 'fullName')
    .populate('country', 'name')
    .populate('state', 'name')
    .populate('city', 'name')
    .populate('category', 'name');
  return project;
};

const getProject = async (id) => {
  const desiredFields = 'title description price contactNumber category approval location images area amenities facing city state country pincode highlights layout floorPlans locationMap virtualTour completionYear videos gallery status createdBy docs address'
  const project = await Project.findById(id).select(desiredFields)
    .populate('createdBy', 'fullName contactNumber')
    .populate('assignedEmployees', 'fullName');
  return project;
};

const getEmployeeProjectById = async (employeeId, projectId) => {
  const desiredFields = 'title description price contactNumber category approval location images area amenities facing city state country pincode highlights layout floorPlans locationMap virtualTour completionYear videos gallery status createdBy docs address'
  const project = await Project.findOne({ _id: projectId, assignedEmployees: { $in: [employeeId] } }).select(desiredFields)
    .populate('createdBy', 'fullName contactNumber')
    .populate('assignedEmployees', 'fullName')
    .populate('country', 'name')
    .populate('state', 'name')
    .populate('city', 'name')
    .populate('category', 'name');
  return project;
};

const queryProjects = async (filter, options) => {
  const projects = await Project.paginate(filter, options);
  return projects;
};

const updateProjectById = async (projectId, updateBody, builderId) => {
  const project = await getProjectById(projectId, builderId);
  Object.assign(project, updateBody);
  await project.save();
  return project;
};

const deleteProjectById = async (projectId, builderId) => {
  const project = await getProjectById(projectId, builderId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  await project.remove();
  return project;
};

const getProjectsByEmployeeId = async (employeeId) => {
  const desiredFields = 'title description price contactNumber category approval location images area amenities facing city state country pincode highlights layout floorPlans locationMap virtualTour completionYear videos gallery status createdBy docs address'
  const projects = await Project.find({ assignedEmployees: { $in: [employeeId] } }).select(desiredFields)
    .populate('assignedProjects', 'title ')
    .populate('createdBy', 'fullName contactNumber')
    .populate('assignedEmployees', 'fullName')
    .populate('country', 'name')
    .populate('state', 'name')
    .populate('city', 'name')
    .populate('category', 'name');
  return projects;

};

const getProjectsByBuilderId = async (builderId) => {
  const desiredFields = 'title description price contactNumber category approval location images area amenities facing city state country pincode highlights layout floorPlans locationMap virtualTour completionYear videos gallery status createdBy docs address'
  const projects = await Project.find({ createdBy: builderId }).select(desiredFields)
    .populate('assignedEmployees', 'fullName')
    .populate('country', 'name')
    .populate('state', 'name')
    .populate('city', 'name')
    .populate('category', 'name');
  return projects;
};

module.exports = { createProject, getProjectById, queryProjects, updateProjectById, deleteProjectById, getProjectsByEmployeeId, getProjectsByBuilderId, getEmployeeProjectById, getProject }