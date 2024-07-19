const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const leadSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: [true, "please enter full name"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "please enter email"],
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email');
            }
        },
    },
    contactNumber: {
        type: Number,
        required: [true, "please enter contact number"],
        trim: true,
    },
    builderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        trim: true,
        ref: "Builder"
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        trim: true,
        ref: "Project"
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        trim: true,
        ref: "Employee"
    },
    status: {
        type: String,
        trim: true,
        default:null
    },
    capturedAt: {
        type: Date,
        default: Date.now,
        required: true
    }
});

leadSchema.plugin(toJSON)
leadSchema.plugin(paginate)

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;
