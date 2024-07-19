const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const SuccessResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const { builderAgentService, apartmentService, projectService } = require('../services');
const { getSignedUrl, s3UploadSingle, s3DeleteMultiple } = require('../services/s3.service');
const { PREFIXES } = require('../utils/constants');

const generateDateBasedFilename = (originalname) => {
    const timestamp = Date.now();
    return `${timestamp}-spim-${originalname}`;
};

const createApartment = catchAsync(async (req, res) => {
    const builderId = req.user?._id;
    const projectId = req.params.projectId;
    const { data, towers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder/agent id");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project id");
    }

    const findBuilder = await builderAgentService.getBuilderAgentById(builderId);
    if (!findBuilder) {
        throw new ApiError(httpStatus.NOT_FOUND, 'builder/agent is not found');
    }

    const findProject = await projectService.getProjectById(projectId, builderId);
    if (!findProject) {
        throw new ApiError(httpStatus.NOT_FOUND, 'project is not found');
    }

    const apartmentCheck = await apartmentService.getApartment({ projectId, builderId })
    if (apartmentCheck) {
        throw new ApiError(httpStatus.FORBIDDEN, 'apartment already exists for this project');
    }

    const processFile = async (file, folder) => {
        const filename = generateDateBasedFilename(file.originalname);
        const url = await s3UploadSingle({
            ...file,
            originalname: filename
        }, folder);
        return filename;
    };

    // categorize images by their field names
    const categorizeFiles = (files) => {
        const fileMap = {};
        files.forEach(file => {
            if (!fileMap[file.fieldname]) {
                fileMap[file.fieldname] = [];
            }
            fileMap[file.fieldname].push(file);
        });
        return fileMap;
    };

    const fileMap = categorizeFiles(req.files);

    const planImageUrls = await Promise.all(
        (fileMap['planImage'] || []).map(file => processFile(file, PREFIXES.APARTMENT_IMG_PREFIX))
    );

    const planSvgUrls = await Promise.all(
        (fileMap['planSvg'] || []).map(file => processFile(file, PREFIXES.APARTMENT_SVG_PREFIX))
    );
    const processRooms = async (rooms, towerIndex, floorIndex, flatIndex) => {
        if ((rooms == null || undefined) || !Array.isArray(rooms)) return [];
        return await Promise.all(rooms.map(async (room, roomIndex) => {
            const roomImageFile = fileMap[`towers[${towerIndex}][floors][${floorIndex}][flats][${flatIndex}][rooms][${roomIndex}][roomImage]`]?.[0];
            const roomSvgFile = fileMap[`towers[${towerIndex}][floors][${floorIndex}][flats][${flatIndex}][rooms][${roomIndex}][roomSvg]`]?.[0];
            const roomImageUrl = roomImageFile ? await processFile(roomImageFile, PREFIXES.APARTMENT_IMG_PREFIX) : null;
            const roomSvgUrl = roomSvgFile ? await processFile(roomSvgFile, PREFIXES.APARTMENT_SVG_PREFIX) : null;
            return {
                roomId: room.roomId,
                roomImage: roomImageUrl,
                roomSvg: roomSvgUrl,
            };
        }));
    };

    const processFlats = async (flats, towerIndex, floorIndex) => {
        if ((flats == null || undefined) || !Array.isArray(flats)) return [];
        return await Promise.all(flats.map(async (flat, flatIndex) => {
            const flatImageFile = fileMap[`towers[${towerIndex}][floors][${floorIndex}][flats][${flatIndex}][flatImage]`]?.[0];
            const flatSvgFile = fileMap[`towers[${towerIndex}][floors][${floorIndex}][flats][${flatIndex}][flatSvg]`]?.[0];
            const flatImageUrl = flatImageFile ? await processFile(flatImageFile, PREFIXES.APARTMENT_IMG_PREFIX) : null;
            const flatSvgUrl = flatSvgFile ? await processFile(flatSvgFile, PREFIXES.APARTMENT_SVG_PREFIX) : null;
            const processedRooms = await processRooms(flat.rooms, towerIndex, floorIndex, flatIndex);
            return {
                flatId: flat.flatId,
                flatImage: flatImageUrl,
                flatSvg: flatSvgUrl,
                rooms: processedRooms,
            };
        }));
    };

    const processFloors = async (floors, towerIndex) => {
        if ((floors == null || undefined) || !Array.isArray(floors)) return [];
        return await Promise.all(floors.map(async (floor, floorIndex) => {
            const floorImageFile = fileMap[`towers[${towerIndex}][floors][${floorIndex}][floorImage]`]?.[0];
            const floorSvgFile = fileMap[`towers[${towerIndex}][floors][${floorIndex}][floorSvg]`]?.[0];
            const floorImageUrl = floorImageFile ? await processFile(floorImageFile, PREFIXES.APARTMENT_IMG_PREFIX) : null;
            const floorSvgUrl = floorSvgFile ? await processFile(floorSvgFile, PREFIXES.APARTMENT_SVG_PREFIX) : null;
            const processedFlats = await processFlats(floor.flats, towerIndex, floorIndex);
            return {
                floorId: floor.floorId,
                floorImage: floorImageUrl,
                floorSvg: floorSvgUrl,
                flats: processedFlats,
            };
        }));
    };

    const processTowers = async (towers) => {
        if ((towers == null || undefined) || !Array.isArray(towers)) return [];
        return await Promise.all(towers.map(async (tower, towerIndex) => {
            const towerImageFile = fileMap[`towers[${towerIndex}][towerImage]`]?.[0];
            const towerSvgFile = fileMap[`towers[${towerIndex}][towerSvg]`]?.[0];
            const towerImageUrl = towerImageFile ? await processFile(towerImageFile, PREFIXES.APARTMENT_IMG_PREFIX) : null;
            const towerSvgUrl = towerSvgFile ? await processFile(towerSvgFile, PREFIXES.APARTMENT_SVG_PREFIX) : null;
            const processedFloors = await processFloors(tower.floors, towerIndex);
            return {
                towerId: tower.towerId,
                towerImage: towerImageUrl,
                towerSvg: towerSvgUrl,
                floors: processedFloors,
            };
        }));
    };

    const processedTowers = await processTowers(towers);

    const apartmentData = {
        planImage: planImageUrls.join(','),
        planSvg: planSvgUrls.join(','),
        towers: processedTowers,
        createdBy: builderId,
        project: projectId,
        data: JSON.parse(data)
    };
    const apartment = await apartmentService.createApartment(apartmentData);
    return new SuccessResponse(httpStatus.CREATED, 'apartment created successfully', apartment).send(res);
});

const getApartment = catchAsync(async (req, res) => {
    const builderId = req.params.builderId;
    const projectId = req.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }

    const builderCheck = await builderAgentService.getBuilderAgentById(builderId);
    if (!builderCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, `${builderCheck.typeOfRole} not found`);
    }

    const project = await projectService.getProjectById(projectId, builderId);

    if (!project) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
    }

    const apartment = await apartmentService.getApartment({ projectId, builderId });
    if (!apartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'apartment not found');
    }

    if (apartment.planImage != null) {
        const imagesUrls = await getSignedUrl(apartment.planImage, PREFIXES.APARTMENT_IMG_PREFIX);
        apartment.planImage = imagesUrls;
    }

    if (apartment.planSvg != null) {
        const svgsUrls = await getSignedUrl(apartment.planSvg, PREFIXES.APARTMENT_SVG_PREFIX);
        apartment.planSvg = svgsUrls;
    }

    await Promise.all(apartment.towers.length > 0 && apartment.towers.map(async (tower) => {
        tower.towerImage = await getSignedUrl(tower.towerImage, PREFIXES.APARTMENT_IMG_PREFIX);
        tower.towerSvg = await getSignedUrl(tower.towerSvg, PREFIXES.APARTMENT_SVG_PREFIX);

        await Promise.all(tower.floors.map(async (floor) => {
            floor.floorImage = await getSignedUrl(floor.floorImage, PREFIXES.APARTMENT_IMG_PREFIX);
            floor.floorSvg = await getSignedUrl(floor.floorSvg, PREFIXES.APARTMENT_SVG_PREFIX);

            await Promise.all(floor.flats.map(async (flat) => {
                flat.flatImage = await getSignedUrl(flat.flatImage, PREFIXES.APARTMENT_IMG_PREFIX);
                flat.flatSvg = await getSignedUrl(flat.flatSvg, PREFIXES.APARTMENT_SVG_PREFIX);
            }));
        }));
    }));

    return new SuccessResponse(httpStatus.OK, 'apartment retrived successfully', apartment).send(res);
})

const deleteApartment = catchAsync(async (req, res) => {
    const builderId = req.user._id;
    const projectId = req.params.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }

    const builderCheck = await builderAgentService.getBuilderAgentById(builderId);
    if (!builderCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, `${builderCheck.typeOfRole} not found`);
    }

    const project = await projectService.getProjectById(projectId, builderId);

    if (!project) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
    }

    const apartment = await apartmentService.getApartment({ projectId, builderId });
    if (!apartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'apartment not found');
    }
    const filesToDelete = [];

    if (apartment.planImage) {
        filesToDelete.push({ url: `apartments/images/${apartment.planImage}` });
    }
    if (apartment.planSvg) {
        filesToDelete.push({ url: `apartments/svgs/${apartment.planSvg}` });
    }

    await Promise.all(apartment.towers.map(async (tower) => {
        if (tower.towerImage) {
            filesToDelete.push({ url: `apartments/images/${tower.towerImage}` });
        }
        if (tower.towerSvg) {
            filesToDelete.push({ url: `apartments/svgs/${tower.towerSvg}` });
        }

        await Promise.all(tower.floors.map(async (floor) => {
            if (floor.floorImage) {
                filesToDelete.push({ url: `apartments/images/${floor.floorImage}` });
            }
            if (floor.floorSvg) {
                filesToDelete.push({ url: `apartments/svgs/${floor.floorSvg}` });
            }

            await Promise.all(floor.flats.map(async (flat) => {
                if (flat.flatImage) {
                    filesToDelete.push({ url: `apartments/images/${flat.flatImage}` });
                }
                if (flat.flatSvg) {
                    filesToDelete.push({ url: `apartments/svgs/${flat.flatSvg}` });
                }
            }));
        }));
    }));

    await s3DeleteMultiple(filesToDelete);
    await apartmentService.deletePlotting({ projectId, builderId })
    return new SuccessResponse(httpStatus.OK, 'apartment deleted successfully').send(res);
})

module.exports = { createApartment, getApartment, deleteApartment }
