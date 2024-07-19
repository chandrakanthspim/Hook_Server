const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const StateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "please enter the state name"],
        trim: true,
        unique: true
    },
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        required: true
    }, cities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    }]
});

StateSchema.plugin(toJSON);
StateSchema.plugin(paginate);

const State = mongoose.model('State', StateSchema);

module.exports = State;