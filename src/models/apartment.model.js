const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const apartmentSchema = new mongoose.Schema({
    planImage: {
        type: String,
        trim: true,
        required: [true, "please enter a plan image"],
    },
    planSvg: {
        type: String,
        trim: true,
        required: [true, "please enter a apartment svg"],
    },
    towers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tower'
    }],
    data: [{
        towerNumber: String,
        towerName: String,
        floorNumber: String,
        floorName: String,
        flatNumber: String,
        flatName: String,
        flatType: String,
        flatStatus: String,
        flatFacing: String,
        flatArea: String,
        flatAreaInUnits: String
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Builder',
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    noOfTowers:{
        type: Number,
        trim: true,
        required: [true, "please enter a no of towers"],
    }
}, {
    timestamps: true,
});

apartmentSchema.plugin(toJSON);
apartmentSchema.plugin(paginate);

const Apartment = mongoose.model('Apartment', apartmentSchema);
module.exports = Apartment;
