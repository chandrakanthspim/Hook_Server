const httpStatus = require("http-status");
const { Employee, Project } = require("../models");
const ApiError = require("../utils/ApiError");
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const createEmployee = async (employeeBody, role) => {
    if (role == 'admin') {
        return await Employee.create(employeeBody);
    } else if (role == 'builder') {
        return await Employee.create(employeeBody);
    } else if (role == 'agent') {
        return await Employee.create(employeeBody);
    }
};

const getEmployeeById = async (employeeId) => {
    const desiredFields = "fullName email contactNumber gender profilePic projects status role assignedProjects createdBy";
    const employee = await Employee.findById(employeeId)
        .select(desiredFields)
        .populate('projects', 'title')
        .populate('createdBy', 'fullName')
        .populate('assignedProjects', 'title');
    if (!employee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'employee not found');
    }
    return employee;
};

const getEmployeeBuilderAgentById = async (employeeId, builderId) => {
    const desiredFields = "fullName email contactNumber gender profilePic projects status role assignedProjects createdBy";
    const employee = await Employee.findOne({ _id: employeeId, createdBy: builderId })
        .select(desiredFields)
        .populate('projects', 'title')
        .populate('createdBy', 'fullName')
        .populate('assignedProjects', 'title');
    if (!employee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'employee not found');
    }
    return employee;
};

const getEmployeeByEmail = async (email) => {

    const employee = await Employee.findOne({ email });
    if (!employee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    }
    return employee
};

const queryEmployees = async (filter, options) => {
    const employee = await Employee.paginate(filter, options);
    return employee;
};

//access builder
const getEmployeesByBuilder = async (builderId) => {
    const employees = await Employee.find({ createdBy: builderId }).populate('assignedProjects', 'title').populate('createdBy', 'fullName');
    return employees;
}

const updateEmployeeById = async (employeeId, updateBody, builderId) => {
    const employee = await getEmployeeBuilderAgentById(employeeId, builderId);
    if (!employee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Employee Id not found');
    }
    const newEmployee = Object.assign(employee, updateBody);
    await newEmployee.save();
    return newEmployee;
};

const updateEmployeePassword = async (employeeId, newPassword) => {
    const employee = await getEmployeeById(employeeId);
    if (!employee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 8);
    return Employee.findByIdAndUpdate(employeeId, { password: hashedPassword }, { new: true });
};

const deleteEmployeeById = async (employeeId, role, builderId) => {
    const employee = await getEmployeeBuilderAgentById(employeeId, builderId);
    if (!employee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    }
    if (role == 'builder') {
        await employee.remove();
        return employee;
    } else if (role == 'agent') {
        await employee.remove();
        return employee;
    }
};


//bot employee service
//projectId ==> employees
//employeeId=employee details


// retrive all employees under project
// arg as projectId
const retrieveEmployeeByProjectId = async (projectId) => {
    const result = {
        success: true,
        message: 'None',
        data: {},
    };

    try {
        if (!projectId) {
            throw new Error('Invalid employee ID');
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw new Error('Please provide a valid mongoose ID');
        }

        const projectDetails = await Project.findById(projectId).select('-createdAt -updatedAt -__v');

        const employeeDetails = await Employee.find({ _id: { $in: projectDetails.assignedEmployees } }).select('-password -createdAt -updatedAt -__v');
        if (!employeeDetails) {
            result.success = false;
            result.message = 'No employee found with the given ID';
        } else {
            result.data = employeeDetails;
            result.message = 'Employees retrieved successfully';
        }
    } catch (error) {
        console.log(error);
        result.success = false;
        result.message = error.message || 'An error occurred';
    }

    console.log('result', result);
    return result;
};

//   retrieveEmployeeByProjectId("667280d5910f7e3d00d9152d")


// retrive single employee 
// arg as employeeId
const retrieveEmployeeById = async (employeeId) => {
    const result = {
        success: true,
        message: 'None',
        data: {},
    };

    try {
        if (!employeeId) {
            throw new Error('Invalid employee ID');
        }

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            throw new Error('Please provide a valid mongoose ID');
        }

        const employeeDetails = await Employee.findById(employeeId).select('-password -createdAt -updatedAt -__v');
        if (!employeeDetails) {
            result.success = false;
            result.message = 'No employee found with the given ID';
        } else {
            result.data = employeeDetails;
            result.message = 'Employee retrieved successfully';
        }
    } catch (error) {
        console.log(error);
        result.success = false;
        result.message = error.message || 'An error occurred';
    }

    console.log('result', result);
    return result;
};

//   retrieveEmployeeById("668d240581ec781824a22823")

module.exports = { createEmployee, getEmployeeById, getEmployeeByEmail, queryEmployees, updateEmployeeById, updateEmployeePassword, deleteEmployeeById, getEmployeesByBuilder, getEmployeeBuilderAgentById }