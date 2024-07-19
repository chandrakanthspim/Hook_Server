const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const { Gender, UserStatus } = require('../utils/constants');

const adminSchema = new mongoose.Schema(
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
      match: [/^[1-9][0-9]{9}$/, 'The value of path {PATH} ({VALUE}) is not a valid mobile number.']
    },
    gender: {
      type: String,
      required: [true, "please select the gender"],
      enum:[Gender.MALE,Gender.FEMALE,Gender.OTHERS]
    },
    role: {
      type: String,
      enum: roles,
      default: 'admin',
    },
    plans: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    }],
    status: {
      type: String,
      enum: [UserStatus.ACTIVE,UserStatus.BLOCK,UserStatus.INACTIVE],
      default: UserStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
adminSchema.plugin(toJSON);
adminSchema.plugin(paginate);

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
adminSchema.methods.isPasswordMatch = async function (password) {
  const admin = this;
  return bcrypt.compare(password, admin.password);
};

adminSchema.pre('save', async function (next) {
  const admin = this;
  if (admin.isModified('password')) {
    admin.password = await bcrypt.hash(admin.password, 8);
  }
  next();
});

/**
 * @typedef Admin
 */
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
