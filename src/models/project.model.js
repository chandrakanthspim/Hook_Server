const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { ProjectStatus, ApprovalType } = require('../utils/constants');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'please enter project title'],
    minLength: [4, 'please enter project name of above 4 characters']
  },
  description: {
    type: String,
    required: [true, 'please enter project description'],
  },
  price: {
    type: Number
  },
  contactNumber: {
    type: Number,
    trim: true,
    required: [true, "please enter a project mobile number"],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Builder',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  approval: {
    type: {
      type: String, //rera,hmda,dtcp
      enum: [ApprovalType.NONE, ApprovalType.RERA, ApprovalType.HMDA, ApprovalType.DTCP],
      default: ApprovalType.NONE
    },
    value: {
      type: String,
      default: null
    }
  },
  address: {
    type: String
  },
  area: {
    type: Number,
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  state: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  },
  pincode: {
    type: Number,
  },
  gallery: [{
    url: {
      type: String
    }
  }],
  highlights: [{
    url: {
      type: String
    }
  }],
  layout: [{
    url: {
      type: String
    }
  }],
  floorPlans: [{
    url: {
      type: String
    }
  }],
  amenities: [{
    url: {
      type: String
    }
  }],
  locationMap: { type: String },
  completionYear: { type: Number },
  videos: [{
    url: {
      type: String
    }
  }],
  docs: [{
    url: {
      type: String
    }
  }],
  assignedEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  status: {
    type: String,
    enum: [ProjectStatus.PRE_LAUNCH, ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED],
    required: [true, "please select a project status"],
  },
}, {
  timestamps: true,
});

ProjectSchema.plugin(toJSON);
ProjectSchema.plugin(paginate);

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;