const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const SuccessResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const { builderAgentService, floorService, flatService } = require('../services');
const { getSignedUrl, s3UploadSingle, s3DeleteMultiple, s3DeleteSingle } = require('../services/s3.service');
const { PREFIXES } = require('../utils/constants');
const { UserCheck } = require('../services/admin.service');

const generateDateBasedFilename = (originalname) => {
    const timestamp = Date.now();
    return `spim-${timestamp}-${originalname}`;
};

const createFlat = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const files = req.files;
    const { floorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(floorId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid floor Id");
    }
    await UserCheck(userRole, userId);

    const findFloor = await floorService.getFloor(floorId);
    if (!findFloor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Floor not found');
    }

    if (findFloor.flats.length >= findFloor.noOfFlats) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Maximum number of flats reached for this tower');
    }

    const processFile = async (file, folder) => {
        const filename = generateDateBasedFilename(file.originalname);
        const url = await s3UploadSingle({
            ...file,
            originalname: filename
        }, folder);
        return filename;
    };

    const flatImageUrl = await Promise.all(
        (files['flatImage'] || []).map(file => processFile(file, PREFIXES.APARTMENT_IMG_PREFIX))
    );

    const flatSvgUrl = await Promise.all(
        (files['flatSvg'] || []).map(file => processFile(file, PREFIXES.APARTMENT_SVG_PREFIX))
    );

    const flatData = {
        flatId: req.body.flatId,
        flatImage: flatImageUrl.join(','),
        flatSvg: flatSvgUrl.join(','),
        floorId: floorId
    };
    const flat = await flatService.createFlat(flatData);
    findFloor.flats.push(flat._id)
    await findFloor.save()
    return new SuccessResponse(httpStatus.CREATED, 'flat created successfully', flat).send(res);
});

const getFlat = catchAsync(async (req, res) => {
    const { flatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(flatId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid flat Id");
    }
    const flat = await flatService.getFlat(flatId);
    if (!flat) {
        throw new ApiError(httpStatus.NOT_FOUND, 'flat not found');
    }

    if (flat.flatImage != null) {
        const imagesUrls = await getSignedUrl(flat.flatImage, PREFIXES.APARTMENT_IMG_PREFIX);
        flat.flatImage = imagesUrls;
    }

    if (flat.flatSvg != null) {
        const svgsUrls = await getSignedUrl(flat.flatSvg, PREFIXES.APARTMENT_SVG_PREFIX);
        flat.flatSvg = svgsUrls;
    }
    return new SuccessResponse(httpStatus.OK, 'flat retrived successfully', flat).send(res);
});

const getFlats = catchAsync(async (req, res) => {
    const { floorId } = req.params

    if (!mongoose.Types.ObjectId.isValid(floorId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid floor Id");
    }

    const findFloor = await floorService.getFloor(floorId);
    if (!findFloor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'floor is not found');
    }

    const flat = await flatService.getFlatsByFloorId(floorId);
    if (!flat) {
        throw new ApiError(httpStatus.NOT_FOUND, 'flats not found');
    }

    return new SuccessResponse(httpStatus.OK, 'flats retrived successfully', flat).send(res);
});

const updateFlat = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const flatId = req.params.flatId;
    const updateBody = req.body;
    const files = req.files;

    if (!mongoose.Types.ObjectId.isValid(flatId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid flat Id");
    }
    await UserCheck(userRole, userId);

    const flat = await flatService.getFlat(flatId);
    if (!flat) {
        throw new ApiError(httpStatus.NOT_FOUND, 'flat not found');
    }

    const validKeys = ['flatSvg', 'flatImage'];

    const getS3KeyPrefix = (key) => {
        switch (key) {
            case 'flatSvg':
                return PREFIXES.APARTMENT_SVG_PREFIX;
            case 'flatImage':
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
        const oldFlat = await flatService.getFlat(flatId);
        const oldFilename = oldFlat[key];
        if (oldFilename) {
            await s3DeleteSingle({ filename: oldFilename }, getS3KeyPrefix(key));
        }
        await fileUpload(key, file, updateBody);
    };

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

    const updatedFlat = await flatService.updateFlat(flatId, updateBody);
    return new SuccessResponse(httpStatus.OK, `flat updated successfully`, updatedFlat).send(res);
});

const deleteFlat = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const { flatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(flatId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid flat Id");
    }

    await UserCheck(userRole, userId);

    const flat = await flatService.getFlat(flatId);
    if (!flat) {
        throw new ApiError(httpStatus.NOT_FOUND, 'flat not found');
    }
    const filesToDelete = [];

    if (flat.flatImage) {
        filesToDelete.push({ url: `apartments/images/${flat.flatImage}` });
    }
    if (flat.flatSvg) {
        filesToDelete.push({ url: `apartments/svgs/${flat.flatSvg}` });
    }
    await s3DeleteMultiple(filesToDelete);
    await floorService.updateFloor(flat?.floorId, {
        $pull: { flats: flatId }
    });
    await flatService.deleteFlat(flatId)
    return new SuccessResponse(httpStatus.OK, 'flat deleted successfully').send(res);
})

module.exports = { createFlat, getFlats, getFlat, updateFlat, deleteFlat }