const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const plottingSchema = mongoose.Schema(
  {
    projectLocation: {
      type: String,
      required: [true, 'please enter project location'],
    },
    websiteUrl: {
      type: String,
      required: [true, 'please enter website url'],
    },
    plotSvg: {
      type: String,
      required: [true, 'please upload  plot svg']
    },
    layoutData: {
      type: [Object],
    }, // JSON layout data
    logo: {
      type: String,
      required: [true, 'please upload logo']
    },
    plotImage: {
      type: String,
      required: [true, 'please upload  plot image']
    },
    mapImage: {
      type: String,
      required: [true, 'please upload map image']
    },
    highlightsImage: {
      type: String,
      required: [true, 'please upload highlights image']
    },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    builderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Builder' },
  },
  {
    timestamps: true,
  }
);

plottingSchema.plugin(toJSON);
plottingSchema.plugin(paginate);

/**
 * @typedef availibility
 */
const Plotting = mongoose.model('Plotting', plottingSchema);

module.exports = Plotting;
