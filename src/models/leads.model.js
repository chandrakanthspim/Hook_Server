const { Schema, model } = require('mongoose');
const { generateUniqueIdentifier } = require('../utils/utils');

const leadSchema = Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    propertiesVisited:{
      type:[{ type: Schema.Types.ObjectId, ref: 'Project'}]
    },
    citiesVisited:{
      type:[String],
    },
    lastVisitedCity:{type:String, required:false},
    lastVisitedProperty:{type:String, required:false},
    lastVisitedProjectType:{type:String, required:false},
    city: { type: String, required: false },
    state: { type: String, required: false },
    country: { type: String, required: false },
    priority: { type: String, required: false, default: 'moderate' },
    status: { type: String, required: false }, // closed, followed up, contacted etc.
    clientName: { type: String, required: false },
    clientPhone: { type: String, required: false },
    clientEmail: { type: String, required: false },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    source: { type: String, required: false }, // facebook,instagram etc.
    description: { type: String, required: false },
    allocatedTo: { type: [Schema.Types.ObjectId], ref: 'User' },
    images: { type: [String], required: false, default: [] },
    isArchived: { type: Boolean, required: false, default: false },
    uid: { type: String },
    sessionID:{type:String}
  },
  { timestamps: true }
);

// Before saving a new document, generate a unique readable identifier
leadSchema.pre('save', async function (next) {
  if (!this.uid) {
    let isUnique = false;
    let generatedIdentifier;

    while (!isUnique) {
      // Generate a unique identifier (you can use a library for this)
      generatedIdentifier = generateUniqueIdentifier();

      // Check if it's unique in the collection
      const existingDocument = await this.constructor.findOne({ uid: generatedIdentifier });

      if (!existingDocument) {
        isUnique = true; // Identifier is unique, exit the loop
      }
    }

    // Assign the generated identifier to the document
    this.uid = generatedIdentifier;
  }
  next();
});

const leadModel = model('Leadx', leadSchema);
module.exports = leadModel;
