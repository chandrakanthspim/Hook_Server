const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const buildingSchema = mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, required: true },
    builderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: {
      type: String,
      default: 'apartment',
    },
    masterPlanLayout: {
      type: Object,
    },
    layoutData: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

buildingSchema.plugin(toJSON);
buildingSchema.plugin(paginate);

/**
 * @typedef availibility
 */
const Building = mongoose.model('Building', buildingSchema);

module.exports = Building;
