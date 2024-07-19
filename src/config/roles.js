const allRoles = {
  admin: [
    'getAdmin', 'updateAdmin', "adminRefresh", "adminUpdatePassword",
    'createBuilder', "getBuilderAgentById", 'getBuilders', "updateBuilder", "deleteBuilder", "updateBuilderPasswordByAdmin","upgradeBuilderPlan",
    "createPlan", "getPlan", "getPlans", "updatePlan", "deletePlan",
    "createProject", "getProjects", "getProjectById", "updateProject", "deleteProject", "getProjectsStatistics",
    "createEmployee", "getEmployees", "updateEmployee", "deleteEmployee", "rmEmpFrProject",
    "getEmployeeById", "getAgents", "deleteAgent",
    "createApartment", "deleteApartment", "updateApartment", "getAllApartments", "getApartmentStatistics",
    "createTower", "updateTower", "deleteTower",
    "createFloor", "updateFloor", "deleteFloor",
    "createFlat", "updateFlat", "deleteFlat",
    "createPlotting", "getPlotting", "getAllPlotting", "updatePlotting", "deletePlotting", "getBuilderPlotting",
    "createCountry", "getCountries", "getCountry", "updateCountry", "deleteCountry",
    "createCity", "getCities", "getCity", "updateCity", "deleteCity",
    "createState", "getStates", "getState", "updateState", "deleteState",
    "createCategory", "getCategories", "getCategory", "updateCategory", "deleteCategory",
    "getLead", "getProjectLeads", "getBuilderLeads", "getEmployeeLeads", "updateLead", "deleteLead", "deleteBuilderLeads",
    // "deleteLead","deleteBuilderLeads",

    // change based on requirement
    'manageleads', 'managePlotting',
    'getCustomData', 'createCustomData', 'updateCustomData', 'deleteCustomData',
    "getApartmentsStatistics"
  ],
  builder: [
    "getBuilder", "updateBuilder", "builderUpdatePassword",
    'createProject', 'getProjectById', 'getProjectsByBuilderAgent', 'updateProject', 'deleteProject', "getProjectsStatistics",
    'createEmployee', "getEmployee", "getBuilderEmployees", "updateEmployee", "deleteEmployee", "rmEmpFrProject",
    'getPlan', "getEmployeeByAgentBuilder", "employeeUpdatePassword",
    "getCategories", "getCategory",
    "createApartment", "deleteApartment", "updateApartment", "getBuilderApartments", "getApartmentStatistics",
    "createTower", "updateTower", "deleteTower",
    "createFloor", "updateFloor", "deleteFloor",
    "createFlat", "updateFlat", "deleteFlat",
    "createPlotting", "updatePlotting", "deletePlotting",
    "getCountries", "getCountry",
    "getStates", "getState",
    "getCities", "getCity",
    "getLead", "getProjectLeads", "getBuilderLeads", "getEmployeeLeads", "updateLead", "deleteLead", "deleteBuilderLeads", "getProjectLeadsStats",
    // "deleteLead","deleteBuilderLeads",

    // change based on requirement
    'manageleads', 'managePlotting',
    'getCustomData', 'createCustomData', 'updateCustomData', 'deleteCustomData'
  ],
  agent: [
    "getAgent", "updateAgent", "agentUpdatePassword",
    "createProject", "getProjectById", "getProjectsByBuilderAgent", "updateProject", "deleteProject", "getProjectsStatistics",
    'createEmployee', "getEmployee", "getAgentEmployees", "updateEmployee", "deleteEmployee", "rmEmpFrProject",
    'getPlan', "getEmployeeByAgentBuilder", "employeeUpdatePassword",
    "getCategories", "getCategory",
    "createApartment", "deleteApartment", "updateApartment", "getBuilderApartments", "getApartmentStatistics",
    "createTower", "updateTower", "deleteTower",
    "createFloor", "updateFloor", "deleteFloor",
    "createFlat", "updateFlat", "deleteFlat",
    "createPlotting", "updatePlotting", "deletePlotting",
    "getCountries", "getCountry",
    "getStates", "getState",
    "getCities", "getCity",
    "getLead", "updateLead", "getBuilderLeads", "getProjectLeads", "getEmployeeLeads",
    // "deleteLead","deleteBuilderLeads",
  ],
  employee: [
    "getEmployee", "employeeUpdatePassword",
    'getProjectByEmployee', "getEmployeeProjects",
    "getCountries", "getCountry",
    "getStates", "getState",
    "getCities", "getCity",
  ]
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
