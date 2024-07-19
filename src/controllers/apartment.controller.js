const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const SuccessResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const { apartmentService, projectService, adminService, towerService, floorService, flatService, builderAgentService } = require('../services');
const { getSignedUrl, s3UploadSingle, s3DeleteMultiple, s3DeleteSingle } = require('../services/s3.service');
const { PREFIXES, RoleType } = require('../utils/constants');
const pick = require('../utils/pick');
const { checkUser } = require('../services/admin.service');

const generateDateBasedFilename = (originalname) => {
    const timestamp = Date.now();
    return `spim-${timestamp}-${originalname}`;
};

const createApartment = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = userRole === RoleType.ADMIN && req.query.builderId;
    const { projectId } = req.params;
    const { data, noOfTowers } = req.body;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder/agent id");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project id");
    }
    await checkUser(userRole, userId, actualUserId)
    const findProject = await projectService.getProjectById(projectId, actualUserId);
    if (!findProject) {
        throw new ApiError(httpStatus.NOT_FOUND, 'project is not found');
    }

    const apartmentCheck = await apartmentService.getApartment(projectId, actualUserId)
    if (apartmentCheck) {
        throw new ApiError(httpStatus.FORBIDDEN, 'apartment already exists for this project');
    }

    const processFile = async (file, folder) => {
        const filename = generateDateBasedFilename(file.originalname);
        return filename;
    };

    const planImageUrls = await Promise.all(
        (req.files['planImage'] || []).map(file => processFile(file, PREFIXES.APARTMENT_IMG_PREFIX))
    );

    const planSvgUrls = await Promise.all(
        (req.files['planSvg'] || []).map(file => processFile(file, PREFIXES.APARTMENT_SVG_PREFIX))
    );

    const apartmentData = {
        planImage: planImageUrls.join(','),
        planSvg: planSvgUrls.join(','),
        createdBy: actualUserId,
        project: projectId,
        data: JSON.parse(data),
        noOfTowers: noOfTowers
    };
    const apartment = await apartmentService.createApartment(apartmentData);
    return new SuccessResponse(httpStatus.CREATED, 'apartment created successfully', apartment).send(res);
});

const getApartment = catchAsync(async (req, res) => {
    const { builderId } = req.query;
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }
    await builderAgentService.getBuilderAgentById(builderId);

    const project = await projectService.getProjectById(projectId, builderId);
    if (!project) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
    }

    const apartment = await apartmentService.getApartment(projectId, builderId);
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
    return new SuccessResponse(httpStatus.OK, 'apartment retrived successfully', apartment).send(res);
})

const getOverallApartment = catchAsync(async (req, res) => {
    const { builderId } = req.query;
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }

    await builderAgentService.getBuilderAgentById(builderId);

    const project = await projectService.getProjectById(projectId, builderId);
    if (!project) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
    }

    const apartment = await apartmentService.getApartment(projectId, builderId);
    if (!apartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Apartment not found');
    }

    if (apartment.planImage != null) {
        apartment.planImage = await getSignedUrl(apartment.planImage, PREFIXES.APARTMENT_IMG_PREFIX);
    }

    if (apartment.planSvg != null) {
        apartment.planSvg = await getSignedUrl(apartment.planSvg, PREFIXES.APARTMENT_SVG_PREFIX);
    }

    const towers = await towerService.getTowersByApartmentId(apartment._id);
    const towersData = await Promise.all(towers.map(async (tower) => {
        if (tower.towerImage != null) {
            tower.towerImage = await getSignedUrl(tower.towerImage, PREFIXES.APARTMENT_IMG_PREFIX);
        }

        if (tower.towerSvg != null) {
            tower.towerSvg = await getSignedUrl(tower.towerSvg, PREFIXES.APARTMENT_SVG_PREFIX);
        }

        const floors = await floorService.getFloorsByTowerId(tower._id);
        const floorsData = await Promise.all(floors.map(async (floor) => {
            if (floor.floorImage != null) {
                floor.floorImage = await getSignedUrl(floor.floorImage, PREFIXES.APARTMENT_IMG_PREFIX);
            }

            if (floor.floorSvg != null) {
                floor.floorSvg = await getSignedUrl(floor.floorSvg, PREFIXES.APARTMENT_SVG_PREFIX);
            }

            const flats = await flatService.getFlatsByFloorId(floor._id);
            const flatsData = await Promise.all(flats.map(async (flat) => {
                if (flat.flatImage != null) {
                    flat.flatImage = await getSignedUrl(flat.flatImage, PREFIXES.APARTMENT_IMG_PREFIX);
                }

                if (flat.flatSvg != null) {
                    flat.flatSvg = await getSignedUrl(flat.flatSvg, PREFIXES.APARTMENT_SVG_PREFIX);
                }

                return {
                    id:flat._id,
                    flatId: flat.flatId,
                    flatImage: flat.flatImage,
                    flatSvg: flat.flatSvg,
                    rooms: flat.rooms.map(room => ({
                        rommId: room._id,
                        rommImage: room.rommImage,
                        rommSvg: room.rommSvg,
                    }))
                };
            }));

            return {
                id: floor._id,
                floorId:floor.floorId,
                floorImage: floor.floorImage,
                floorSvg: floor.floorSvg,
                flats: flatsData
            };
        }));

        return {
            id: tower._id,
            towerId:tower.towerId,
            towerImage: tower.towerImage,
            towerSvg: tower.towerSvg,
            floors: floorsData
        };
    }));

    const response = {
        planImage: apartment.planImage,
        planSvg: apartment.planSvg,
        towers: towersData,
        data: apartment.data,
        createdBy: apartment.createdBy,
        project: apartment.project,
        createdAt: apartment.createdAt,
        updatedAt: apartment.updatedAt,
    };

    return new SuccessResponse(httpStatus.OK, 'apartment retrived successfully', response).send(res);
});

const getBuilderApartments = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = userRole === RoleType.ADMIN && req.query.builderId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    await checkUser(userRole, userId, actualUserId)
    const apartment = await apartmentService.getBuilderApartment(actualUserId);
    if (!apartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'apartments are not found');
    }
    return new SuccessResponse(httpStatus.OK, 'apartments retrived successfully', apartment).send(res);
})

const getAllApartments = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adminId = userRole === RoleType.ADMIN && userId;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder/agent id");
    }

    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
    }

    const filter = pick(req.query, ['project', 'createdBy']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const apartmentData = await apartmentService.queryApartments(filter, options);
    return new SuccessResponse(httpStatus.OK, 'apartments retrived successfully', apartmentData).send(res);
});

const updateApartment = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = userRole === RoleType.ADMIN && req.query.builderId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;
    const { projectId } = req.params;
    const updateBody = req.body;
    const files = req.files;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }
    await checkUser(userRole, userId, actualUserId)
    const project = await projectService.getProjectById(projectId, actualUserId);

    if (!project) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
    }

    const apartment = await apartmentService.getApartment(projectId, actualUserId);
    if (!apartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'apartment not found');
    }

    const validKeys = ['planSvg', 'planImage'];

    const getS3KeyPrefix = (key) => {
        switch (key) {
            case 'planSvg':
                return PREFIXES.APARTMENT_SVG_PREFIX;
            case 'planImage':
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
        const oldApartment = await apartmentService.getApartment(projectId, actualUserId);
        const oldFilename = oldApartment[key];
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

    const updatedApartment = await apartmentService.updateApartment(projectId, actualUserId, updateBody);
    return new SuccessResponse(httpStatus.OK, `Plotting updated successfully`, updatedApartment).send(res);
});

const deleteApartment = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const { _id: userId, role: userRole } = req.user;
    const adUserId = userRole === RoleType.ADMIN && req.query.builderId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }
    await checkUser(userRole, userId, actualUserId)
    const project = await projectService.getProjectById(projectId, actualUserId);
    if (!project) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
    }

    const apartment = await apartmentService.getApartment(projectId, actualUserId);
    if (!apartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Apartment not found');
    }

    const filesToDelete = [];
    if (apartment.planImage) {
        filesToDelete.push({ url: `apartments/images/${apartment.planImage}` });
    }
    if (apartment.planSvg) {
        filesToDelete.push({ url: `apartments/svgs/${apartment.planSvg}` });
    }

    const towers = await towerService.getTowersByApartmentId(apartment._id);
    await Promise.all(towers.map(async (tower) => {
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
    }));
    await towerService.deleteTowersByApartmentId(apartment._id);
    await s3DeleteMultiple(filesToDelete);
    await apartmentService.deleteApartment(projectId, actualUserId);
    return new SuccessResponse(httpStatus.OK, 'Apartment deleted successfully').send(res);
});

const getDashboardStatistics = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = userRole === RoleType.ADMIN ? req.query.builderId : userId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }
    await checkUser(userRole, userId, actualUserId)
    const apartment = await apartmentService.getStatistics(projectId, actualUserId);
    if (!apartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Apartment not found');
    }

    const towers = {};

    apartment.data.forEach(flat => {
        const {
            towerNumber,
            towerName,
            floorNumber,
            floorName,
            flatType,
            flatStatus,
            flatFacing,
            flatArea
        } = flat;

        if (!towers[towerNumber]) {
            towers[towerNumber] = {
                id: towerNumber,
                name: towerName,
                floors: {},
                totalFlats: 0,
                flatStatusCounts: {},
                flatTypeCounts: {},
                flatFacingCounts: {},
                flatAreaCounts: {},
                availableCounts: {
                    flatType: {},
                    flatFacing: {},
                    flatArea: {}
                }
            };
        }

        const tower = towers[towerNumber];

        if (!tower.floors[floorNumber]) {
            tower.floors[floorNumber] = {
                id: floorNumber,
                name: floorName,
                flats: []
            };
        }

        const floor = tower.floors[floorNumber];

        floor.flats.push(flat);
        tower.totalFlats++;

        // Flat Status Counts
        tower.flatStatusCounts[flatStatus] = (tower.flatStatusCounts[flatStatus] || 0) + 1;

        // Flat Type Counts
        tower.flatTypeCounts[flatType] = (tower.flatTypeCounts[flatType] || 0) + 1;

        // Flat Facing Counts
        tower.flatFacingCounts[flatFacing] = (tower.flatFacingCounts[flatFacing] || 0) + 1;

        // Flat Area Counts
        tower.flatAreaCounts[flatArea] = (tower.flatAreaCounts[flatArea] || 0) + 1;

        // Calculate Available Counts
        if (flatStatus === 'AVAILABLE') {
            // Flat Type
            tower.availableCounts.flatType[flatType] = (tower.availableCounts.flatType[flatType] || 0) + 1;
            // Flat Facing
            tower.availableCounts.flatFacing[flatFacing] = (tower.availableCounts.flatFacing[flatFacing] || 0) + 1;
            // Flat Area
            tower.availableCounts.flatArea[flatArea] = (tower.availableCounts.flatArea[flatArea] || 0) + 1;
        }
    });

    const towerStatistics = Object.values(towers).map(tower => ({
        towerData: {
            id: tower.id,
            name: tower.name,
            floors: Object.keys(tower.floors),
            floorsCount: Object.keys(tower.floors).length,
            flatsCount: tower.totalFlats,
            flatStatusCounts: tower.flatStatusCounts,
            flatTypeCounts: {
                ...tower.flatTypeCounts,
                available: tower.availableCounts.flatType
            },
            flatFacingCounts: {
                ...tower.flatFacingCounts,
                available: tower.availableCounts.flatFacing
            },
            flatAreaCounts: {
                ...tower.flatAreaCounts,
                available: tower.availableCounts.flatArea
            }
        }
    }));

    const statistics = {
        apartmentData: {
            id: apartment._id,
            towers: Object.keys(towers),
            towersCount: Object.keys(towers).length,
            towerStatistics
        }
    };

    return new SuccessResponse(httpStatus.OK, 'Apartment statistics retrieved successfully', statistics).send(res);
});

module.exports = { createApartment, getApartment, getOverallApartment, getAllApartments, updateApartment, deleteApartment, getDashboardStatistics, getBuilderApartments }