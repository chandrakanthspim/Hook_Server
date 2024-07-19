const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const { Gender, UserStatus } = require('../utils/constants');

const employeeSchema = new mongoose.Schema(
  {
    profilePic: {
      type: String,
      default: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    },
    fullName: {
      type: String,
      required: [true, "please enter full name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "please enter email address"],
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: [true, "please enter password"],
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    contactNumber: {
      type: Number,
      trim: true,
      required: [true, "please enter a mobile number"],
    },
    gender: {
      type: String,
      required: [true, "please select the gender"],
      enum: [Gender.MALE,Gender.FEMALE,Gender.OTHERS]
    },
    role: {
      type: String,
      enum: roles,
      default: 'employee',
    },
    assignedProjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    }],
    status: {
      type: String,
      enum: [UserStatus.ACTIVE,UserStatus.BLOCK,UserStatus.INACTIVE],
      default: UserStatus.ACTIVE,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'Builder',
      required: true
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.plugin(toJSON);
employeeSchema.plugin(paginate);

// Add a method to check if password matches
employeeSchema.methods.isPasswordMatch = async function (password) {
  const employee = this;
  return bcrypt.compare(password, employee.password);
};

employeeSchema.pre('save', async function (next) {
  const employee = this;
  if (employee.isModified('password')) {
    employee.password = await bcrypt.hash(employee.password, 8);
  }
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
