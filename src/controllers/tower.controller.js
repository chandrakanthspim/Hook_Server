const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const SuccessResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const { apartmentService, towerService, flatService, floorService } = require('../services');
const { getSignedUrl, s3UploadSingle, s3DeleteMultiple, s3DeleteSingle } = require('../services/s3.service');
const { PREFIXES } = require('../utils/constants');
const { UserCheck } = require('../services/admin.service');

const generateDateBasedFilename = (originalname) => {
    const timestamp = Date.now();
    return `spim-${timestamp}-${originalname}`;
};

const createTower = catchAsync(async (req, res) => {
    const files = req.files;
    const { apartmentId } = req.params;
    const { towerId, noOfFloors } = req.body
    const { _id: userId, role: userRole } = req.user;

    if (!mongoose.Types.ObjectId.isValid(apartmentId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid apartment Id");
    }
    //check user(like a middleware)
    await UserCheck(userRole, userId);
    const findApartment = await apartmentService.getApartmentCheck(apartmentId);
    if (!findApartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'apartment is not found');
    }

    if (findApartment.towers.length >= findApartment.noOfTowers) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Maximum number of towers reached for this apartment');
    }

    const processFile = async (file, folder) => {
        const filename = generateDateBasedFilename(file.originalname);
        const url = await s3UploadSingle({
            ...file,
            originalname: filename
        }, folder);
        return filename;
    };

    const towerImageUrl = await Promise.all(
        (files['towerImage'] || []).map(file => processFile(file, PREFIXES.APARTMENT_IMG_PREFIX))
    );

    const towerSvgUrl = await Promise.all(
        (files['towerSvg'] || []).map(file => processFile(file, PREFIXES.APARTMENT_SVG_PREFIX))
    );

    const towertData = {
        towerId: towerId,
        towerImage: towerImageUrl.join(','),
        towerSvg: towerSvgUrl.join(','),
        apartmentId: apartmentId,
        noOfFloors: noOfFloors
    };
    const tower = await towerService.createTower(towertData);
    findApartment.towers.push(tower._id)
    await findApartment.save()
    return new SuccessResponse(httpStatus.CREATED, 'tower created successfully', tower).send(res);
});

const getTower = catchAsync(async (req, res) => {
    const { towerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(towerId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid tower Id");
    }
    const tower = await towerService.getTower(towerId);
    if (!tower) {
        throw new ApiError(httpStatus.NOT_FOUND, 'tower not found');
    }

    if (tower.towerImage != null) {
        const imagesUrls = await getSignedUrl(tower.towerImage, PREFIXES.APARTMENT_IMG_PREFIX);
        tower.towerImage = imagesUrls;
    }

    if (tower.towerSvg != null) {
        const svgsUrls = await getSignedUrl(tower.towerSvg, PREFIXES.APARTMENT_SVG_PREFIX);
        tower.towerSvg = svgsUrls;
    }
    return new SuccessResponse(httpStatus.OK, 'tower retrived successfully', tower).send(res);
});

const getTowers = catchAsync(async (req, res) => {
    const { apartmentId } = req.params

    if (!mongoose.Types.ObjectId.isValid(apartmentId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid apartment Id");
    }

    const findApartment = await apartmentService.getApartmentCheck(apartmentId);
    if (!findApartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'apartment is not found');
    }

    const tower = await towerService.getTowersByApartmentId(apartmentId);
    if (!tower) {
        throw new ApiError(httpStatus.NOT_FOUND, 'apartment not found');
    }

    return new SuccessResponse(httpStatus.OK, 'tower retrived successfully', tower).send(res);
});

const updateTower = catchAsync(async (req, res) => {
    const { towerId } = req.params;
    const updateBody = req.body;
    const files = req.files;
    const { _id: userId, role: userRole } = req.user;

    if (!mongoose.Types.ObjectId.isValid(towerId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }
    await UserCheck(userRole, userId);
    const tower = await towerService.getTower(towerId);
    if (!tower) {
        throw new ApiError(httpStatus.NOT_FOUND, 'tower not found');
    }

    const validKeys = ['towerSvg', 'towerImage'];

    const getS3KeyPrefix = (key) => {
        switch (key) {
            case 'towerSvg':
                return PREFIXES.APARTMENT_SVG_PREFIX;
            case 'towerImage':
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
        const oldTower = await towerService.getTower(towerId);
        const oldFilename = oldTower[key];
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

    const updatedTower = await towerService.updateTower(towerId, updateBody);
    return new SuccessResponse(httpStatus.OK, `tower updated successfully`, updatedTower).send(res);
});

const deleteTower = catchAsync(async (req, res) => {
    const { towerId } = req.params;
    const { _id: userId, role: userRole } = req.user;

    if (!mongoose.Types.ObjectId.isValid(towerId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid tower Id");
    }

    await UserCheck(userRole, userId);

    const tower = await towerService.getTower(towerId);
    if (!tower) {
        throw new ApiError(httpStatus.NOT_FOUND, 'tower not found');
    }
    const filesToDelete = [];
    if (tower.towerImage) {
        filesToDelete.push({ url: `apartments/images/${tower.towerImage}` });
    }
    if (tower.towerSvg) {
        filesToDelete.push({ url: `apartments/svgs/${tower.towerSvg}` });
    }
    const floors = await floorService.getFloorsByTowerId(tower._id);
    await Promise.all(floors.map(async (floor) => {
        if (floor.floorImage) {
            filesToDelete.push({ url: `apartments/images/${floor.floorImage}` });
        }
        if (floor.floorSvg) {
            filesToDelete.push({ url: `apartments/svgs/${floor.floorSvg}` });
        }

        const flats = await flatService.getFlatsByFloorId(floor._id);
        await Promise.all(flats.map(async (flat) => {
            if (flat.flatImage) {
                filesToDelete.push({ url: `apartments/images/${flat.flatImage}` });
            }
            if (flat.flatSvg) {
                filesToDelete.push({ url: `apartments/svgs/${flat.flatSvg}` });
            }
        }));
        await flatService.deleteFlatsByFloorId(floor._id);
    }));
    await floorService.deleteFloorsByTowerId(tower._id);

    await s3DeleteMultiple(filesToDelete);
    await apartmentService.updateApartmentByTower(tower?.apartmentId, {
        $pull: { towers: towerId }
    });
    await towerService.deleteTower(towerId)
    return new SuccessResponse(httpStatus.OK, 'tower deleted successfully').send(res);
})

module.exports = { createTower, getTowers, getTower, updateTower, deleteTower }