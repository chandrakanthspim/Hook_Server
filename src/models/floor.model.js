const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const floorSchema = new mongoose.Schema({
    floorId: {
        type: String,
        trim: true,
        required: [true, "please enter a floor id"],
    },
    floorImage: {
        type: String,
        trim: true,
        required: [true, "please enter a floor image"],
    },
    floorSvg: {
        type: String,
        trim: true,
        required: [true, "please enter a floor svg"],
    },
    towerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tower'
    },
    flats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flat'
    }],
    noOfFlats: {
        type: Number,
        trim: true,
        required: [true, "please enter a no of flats"],
    }
});

floorSchema.plugin(toJSON);
floorSchema.plugin(paginate);

const Floor = mongoose.model('Floor', floorSchema);
module.exports = Floor;