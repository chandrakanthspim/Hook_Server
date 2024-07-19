const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const apartmentSchema = new mongoose.Schema(
    {
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
            floors: [{
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
                flats: [{
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
                    rooms: [{
                        rommId: String,
                        rommImage: String,
                        rommSvg: String,
                    }]
                }]
            }],
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
    },
    {
        timestamps: true,
    })

apartmentSchema.plugin(toJSON);
apartmentSchema.plugin(paginate);

const Apartment = mongoose.model('Apartment', apartmentSchema);

module.exports = Apartment;