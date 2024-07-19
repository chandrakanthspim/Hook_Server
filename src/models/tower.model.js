const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const towerSchema = new mongoose.Schema({
    towerId: {
        type: String,
        trim: true,
        required: [true, "please enter a tower id"],
    },
    towerImage: {
        type: String,
        trim: true,
        required: [true, "please enter a tower image"],
    },
    towerSvg: {
        type: String,
        trim: true,
        required: [true, "please enter a tower svg"],
    },
    apartmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Apartment'
    },
    floors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor'
    }],
    noOfFloors: {
        type: Number,
        trim: true,
        required: [true, "please enter a no of floors"],
    }
});

towerSchema.plugin(toJSON);
towerSchema.plugin(paginate);

const Tower = mongoose.model('Tower', towerSchema);
module.exports = Tower;
