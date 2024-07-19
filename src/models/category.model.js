const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "please enter category name"],
        trim: true,
        unique: true
    }
});

CategorySchema.plugin(toJSON);
CategorySchema.plugin(paginate);

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
