const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const flatSchema = new mongoose.Schema({
    flatId: {
        type: String,
        trim: true,
        required: [true, "please enter a flat id"],
    },
    flatImage: {
        type: String,
        trim: true,
        required: [true, "please enter a flat image"],
    },
    flatSvg: {
        type: String,
        trim: true,
        required: [true, "please enter a flat svg"],
    },
    floorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor'
    },
    rooms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }]
});

flatSchema.plugin(toJSON);
flatSchema.plugin(paginate);

const Flat = mongoose.model('Flat', flatSchema);
module.exports = Flat;
