const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const { UserStatus, Gender } = require('../utils/constants');

const builderSchema = new mongoose.Schema(
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
        if (!value.match(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)) {
          throw new Error('Password must contain at least one capital letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    address: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: Number,
      trim: true,
      required: [true, "please enter a mobile number"],
    },
    gender: {
      type: String,
      required: [true, "please select the gender"],
      enum: [Gender.MALE, Gender.FEMALE, Gender.OTHERS],
    },
    role: {
      type: String,
      enum: roles,
      required: true,
    },
    projects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    }],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [UserStatus.ACTIVE, UserStatus.BLOCK, UserStatus.INACTIVE],
      default: UserStatus.ACTIVE,
    },
    employees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    }],
    plan: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true,
      },
      paidAmount: {
        type: Number,
        required: true,
      },
      remainingAmount: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        trim: true,
      },
      planExpiry: {
        type: Date,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
    planHistory: [
      {
        plan: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Plan',
        },
        paidAmount: {
          type: Number,
          required: true,
        },
        remainingAmount: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        comment: {
          type: String,
          trim: true,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

builderSchema.plugin(toJSON);
builderSchema.plugin(paginate);

// Add a method to check if password matches
builderSchema.methods.isPasswordMatch = async function (password) {
  const builder = this;
  return bcrypt.compare(password, builder.password);
};

builderSchema.pre('save', async function (next) {
  const builder = this;
  if (builder.isModified('password')) {
    builder.password = await bcrypt.hash(builder.password, 8);
  }
  next();
});

const Builder = mongoose.model('Builder', builderSchema);

module.exports = Builder;
