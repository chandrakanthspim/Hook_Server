const { Admin, Builder, Employee } = require('../models');

const isEmailTakenInAdmin = async (email) => {
    const existingRecord = await Admin.findOne({ email });
    return !!existingRecord;
};

const isEmailTakenInBuilder = async (email) => {
    const existingRecord = await Builder.findOne({ email });
    return !!existingRecord;
};

const isEmailTakenInEmployee = async (email) => {
    const existingRecord = await Employee.findOne({ email });
    return !!existingRecord;
};


const isEmailTaken = async (email) => {
    return await isEmailTakenInEmployee(email) || await isEmailTakenInBuilder(email) || await isEmailTakenInAdmin(email);
}

module.exports = { isEmailTaken }