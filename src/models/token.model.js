const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { tokenTypes } = require('../config/tokens');

const tokenSchema = mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    admin: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Admin',
    },
    builder: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Builder',
    },
    agent: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Agent',
    },
    employee: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Employee',
    },
    role:String,
    type: {
      type: String,
      enum: [tokenTypes.REFRESH, tokenTypes.RESET_PASSWORD, tokenTypes.VERIFY_EMAIL],
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
tokenSchema.plugin(toJSON);

/**
 * @typedef Token
 */
const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;


// const userObject = user.toObject();
// const { password, ...userWithoutPassword } = userObject;
// req.user = userWithoutPassword;