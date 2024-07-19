const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const SuccessResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const { builderAgentService, towerService, floorService, flatService } = require('../services');
const { getSignedUrl, s3UploadSingle, s3DeleteMultiple, s3DeleteSingle } = require('../services/s3.service');
const { PREFIXES } = require('../utils/constants');
const { UserCheck } = require('../services/admin.service');

const generateDateBasedFilename = (originalname) => {
    const timestamp = Date.now();
    return `spim-${timestamp}-${originalname}`;
};

const createFloor = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const { floorId, noOfFlats } = req.body
    const { towerId } = req.params;
    const files = req.files;

    if (!mongoose.Types.ObjectId.isValid(towerId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid tower Id");
    }
    await UserCheck(userRole, userId);
    const findTower = await towerService.getTower(towerId);
    if (!findTower) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Tower not found');
    }

    if (findTower.floors.length >= findTower.noOfFloors) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Maximum number of floors reached for this tower');
    }

    const processFile = async (file, folder) => {
        const filename = generateDateBasedFilename(file.originalname);
        const url = await s3UploadSingle({
            ...file,
            originalname: filename
        }, folder);
        return filename;
    };

    const floorImageUrl = await Promise.all(
        (files['floorImage'] || []).map(file => processFile(file, PREFIXES.APARTMENT_IMG_PREFIX))
    );

    const floorSvgUrl = await Promise.all(
        (files['floorSvg'] || []).map(file => processFile(file, PREFIXES.APARTMENT_SVG_PREFIX))
    );

    const floorData = {
        floorId: floorId,
        floorImage: floorImageUrl.join(','),
        floorSvg: floorSvgUrl.join(','),
        towerId: towerId,
        noOfFlats: noOfFlats
    };
    const floor = await floorService.createFloor(floorData);
    findTower.floors.push(floor._id)
    await findTower.save()
    return new SuccessResponse(httpStatus.CREATED, 'floor created successfully', floor).send(res);
});

const getFloor = catchAsync(async (req, res) => {
    const floorId = req.params.floorId;

    if (!mongoose.Types.ObjectId.isValid(floorId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid floor Id");
    }
    const floor = await floorService.getFloor(floorId);
    if (!floor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'floor not found');
    }
    if (floor.floorImage != null) {
        const imagesUrls = await getSignedUrl(floor.floorImage, PREFIXES.APARTMENT_IMG_PREFIX);
        floor.floorImage = imagesUrls;
    }

    if (floor.floorSvg != null) {
        const svgsUrls = await getSignedUrl(floor.floorSvg, PREFIXES.APARTMENT_SVG_PREFIX);
        floor.floorSvg = svgsUrls;
    }
    return new SuccessResponse(httpStatus.OK, 'floor retrived successfully', floor).send(res);
});

const getFloors = catchAsync(async (req, res) => {
    const { towerId } = req.params

    if (!mongoose.Types.ObjectId.isValid(towerId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid tower Id");
    }

    const findTower = await towerService.getTower(towerId);
    if (!findTower) {
        throw new ApiError(httpStatus.NOT_FOUND, 'tower is not found');
    }

    const floor = await floorService.getFloorsByTowerId( towerId );
    if (!floor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'floors not found');
    }

    return new SuccessResponse(httpStatus.OK, 'floors retrived successfully', floor).send(res);
});

const updateFloor = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const floorId = req.params.floorId;
    const updateBody = req.body;
    const files = req.files;

    if (!mongoose.Types.ObjectId.isValid(floorId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid floor Id");
    }
    await UserCheck(userRole, userId);
    const floor = await floorService.getFloor(floorId);
    if (!floor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'floor not found');
    }

    const validKeys = ['floorSvg', 'floorImage'];

    const getS3KeyPrefix = (key) => {
        switch (key) {
            case 'floorSvg':
                return PREFIXES.APARTMENT_SVG_PREFIX;
            case 'floorImage':
                return PREFIXES.APARTMENT_IMG_PREFIX;
            default:
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid file key");
        }
    };


    const fileUpload = async (key, file, updateBody) => {
        file.originalname = `spim-${Date.now()}-${file.originalname}`;
        await s3UploadSingle({ originalname: file.originalname, buffer: file.buffer }, getS3KeyPrefix(key));
        updateBody[key] = file.originalname;
    };

    const deleteOldOnes = async (key, file, updateBody) => {
        const oldFloor = await floorService.getFloor(floorId);
        const oldFilename = oldFloor[key];
        if (oldFilename) {
            await s3DeleteSingle({ filename: oldFilename }, getS3KeyPrefix(key));
        }
        await fileUpload(key, file, updateBody);
    };
    //files are exists
    if (files && Object.keys(files).length > 0) {
        for (let [key, fileArray] of Object.entries(files)) {
            if (!validKeys.includes(key)) {
                console.error(`Invalid key for upload: ${key}`);
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid file key");
            }
            for (let file of fileArray) {
                await deleteOldOnes(key, file, updateBody);
            }
        }
    }

    const updatedFloor = await floorService.updateFloor(floorId, updateBody);
    return new SuccessResponse(httpStatus.OK, `floor updated successfully`, updatedFloor).send(res);
});

const deleteFloor = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const { floorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(floorId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid floor Id");
    }

    await UserCheck(userRole, userId);

    const floor = await floorService.getFloor(floorId);
    if (!floor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'floor not found');
    }
    const filesToDelete = [];
    if (floor.floorImage) {
        filesToDelete.push({ url: `apartments/images/${floor.floorImage}` });
    }
    if (floor.floorSvg) {
        filesToDelete.push({ url: `apartments/svgs/${floor.floorSvg}` });
    }
    const flats = await flatService.getFlatsByFloorId(floor._id);
    await Promise.all(flats?.map(async (flat) => {
        if (flat.flatImage) {
            filesToDelete.push({ url: `apartments/images/${flat.flatImage}` });
        }
        if (flat.flatSvg) {
            filesToDelete.push({ url: `apartments/svgs/${flat.flatImage}` });
        }
        await flatService.deleteFlatsByFloorId(floor._id);
    }));

    await s3DeleteMultiple(filesToDelete);
    await towerService.updateTower(floor?.towerId, {
        $pull: { floors: floorId }
    });
    await floorService.deleteFloor(floorId)
    return new SuccessResponse(httpStatus.OK, 'floor deleted successfully').send(res);
})

module.exports = { createFloor, getFloor, getFloors, updateFloor, deleteFloor };