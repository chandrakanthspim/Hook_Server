const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const CitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "please enter city name"],
        trim: true,
        unique: true
    },
    state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State'
    }
});

CitySchema.plugin(toJSON);
CitySchema.plugin(paginate);

const City = mongoose.model('City', CitySchema);

module.exports = City;
