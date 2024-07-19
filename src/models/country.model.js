const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const CountrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,"please enter country name"],
        trim:true,
        unique: true
    },
    states: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State'
    }]
});

CountrySchema.plugin(toJSON);
CountrySchema.plugin(paginate);

const Country = mongoose.model('Country', CountrySchema);

module.exports = Country;