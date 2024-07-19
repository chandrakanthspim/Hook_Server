const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { projectService, planService, employeeService, builderAgentService, countryService, stateService, cityService, categoryService } = require('../services');
const SuccessResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const { UserStatus, RoleType, PREFIXES, ProjectStatus } = require('../utils/constants');
const { s3UploadMultiple, getSignedUrlMultiple, s3DeleteMultiple } = require('../services/s3.service');
const { checkUser } = require('../services/admin.service');

const determineKeyPrefix = (key) => {
    if (key === 'gallery' || key === 'highlights' || key === 'layout' || key === 'floorPlans' || key === 'amenities') {
        return PREFIXES.PROJECT_IMG_PREFIX;
    } else if (key === 'videos') {
        return PREFIXES.PROJECT_VIDEOS_PREFIX;
    } else if (key === 'docs') {
        return PREFIXES.PROJECT_DOCS_PREFIX;
    } else {
        return 'project/others';
    }
}

const uploadKeyPrefix = (mimeType) => {
    if (mimeType.startsWith('image/')) {
        return PREFIXES.PROJECT_IMG_PREFIX;
    } else if (mimeType.startsWith('video/')) {
        return PREFIXES.PROJECT_VIDEOS_PREFIX;
    } else if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
        return PREFIXES.PROJECT_DOCS_PREFIX;
    } else {
        return 'project/others';
    }
}

const createProject = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const projectData = req.body;
    const { country, state, city, category } = req.body
    const adUserId = userRole === RoleType.ADMIN && req.params.userId
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder/agent Id");
    }
    await checkUser(userRole, userId, actualUserId)
    const findBuilder = await builderAgentService.getBuilderAgentById(actualUserId);
    if (!findBuilder) {
        throw new ApiError(httpStatus.NOT_FOUND, `builder/agent not found, unable to create project`);
    }
    const actualUserRole = userRole === RoleType.ADMIN ? findBuilder.role : userRole;
    const builderPlan = await planService.getPlanById(findBuilder.plan.planId);
    if (!builderPlan) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found for the builder/agent');
    }

    //check if realted id's exists are not
    await countryService.getCountryById(country);
    await stateService.getStateById(state);
    await cityService.getCityById(city);
    await categoryService.getCategoryById(category);
    if (findBuilder.projects.length >= builderPlan.noOfProjects) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Maximum number of projects reached for the plan');
    }

    if (projectData.employeeId) {
        const employee = await employeeService.getEmployeeBuilderAgentById(projectData.employeeId, actualUserId);
        if (!employee) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
        }
        if (employee.status === UserStatus.INACTIVE) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Employee status is inactive');
        }
    }

    const urlMap = {
        gallery: [],
        highlights: [],
        layout: [],
        floorPlans: [],
        amenities: [],
        videos: [],
        docs: []
    };

    if (req.files && Object.keys(req.files).length > 0) {
        const filesByPrefix = {};

        for (const key of Object.keys(req.files)) {
            const filesArray = req.files[key];
            if (Array.isArray(filesArray) && filesArray.length > 0) {
                console.log(`${key} are present and their count is:`, filesArray.length);

                for (const file of filesArray) {
                    const keyprefix = uploadKeyPrefix(file.mimetype);
                    if (!filesByPrefix[keyprefix]) {
                        filesByPrefix[keyprefix] = [];
                    }
                    filesByPrefix[keyprefix].push({
                        key: `spim-${Date.now()}-${file.originalname}`,
                        buffer: file.buffer,
                        contentType: file.mimetype,
                        fieldname: file.fieldname,
                        originalname: file.originalname
                    });
                }
            }
        }

        for (const prefix in filesByPrefix) {
            const filesToUpload = filesByPrefix[prefix];
            await s3UploadMultiple(filesToUpload, prefix);

            for (const file of filesToUpload) {
                const originalKey = file.fieldname;
                if (!urlMap[originalKey]) {
                    urlMap[originalKey] = [];
                }
                urlMap[originalKey].push({ url: file.key });
            }
        }
    }


    const createdProject = await projectService.createProject({
        createdBy: actualUserId,
        ...projectData,
        ...urlMap
    });

    findBuilder.projects.push(createdProject._id);
    await findBuilder.save();

    if (projectData.employeeId) {
        createdProject.assignedEmployees.push(projectData.employeeId);
        await createdProject.save();
        const employee = await employeeService.getEmployeeBuilderAgentById(projectData.employeeId, actualUserId);
        employee.assignedProjects.push(createdProject._id);
        await employee.save();
    }

    return new SuccessResponse(httpStatus.CREATED, `${actualUserRole} project created successfully`, createdProject).send(res);
});

const getProject = catchAsync(async (req, res) => {
    const { projectId } = req.params
    const { _id: userId, role: userRole } = req.user;
    const adUserId = userRole === RoleType.ADMIN && req.params.userId
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder Id");
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }

    await checkUser(userRole, userId, actualUserId)
    let project = await projectService.getProjectById(projectId, actualUserId);
    if (!project) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
    }

    if (project.images && project.images.length > 0) {
        const imagesUrls = await getSignedUrlMultiple(project.images.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
        project.images = project.images.map((item, index) => ({ _id: item._id, url: imagesUrls[index] }));
    }

    if (project.gallery && project.gallery.length > 0) {
        const galleryUrls = await getSignedUrlMultiple(project.gallery.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
        project.gallery = project.gallery.map((item, index) => ({ _id: item._id, url: galleryUrls[index] }));
    }

    if (project.amenities && project.amenities.length > 0) {
        const amenityUrls = await getSignedUrlMultiple(project.amenities.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
        project.amenities = project.amenities.map((item, index) => ({ _id: item._id, url: amenityUrls[index] }));
    }

    if (project.layout && project.layout.length > 0) {
        const layoutUrls = await getSignedUrlMultiple(project.layout.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
        project.layout = project.layout.map((item, index) => ({ _id: item._id, url: layoutUrls[index] }));
    }

    if (project.highlights && project.highlights.length > 0) {
        const highlightsUrls = await getSignedUrlMultiple(project.highlights.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
        project.highlights = project.highlights.map((item, index) => ({ _id: item._id, url: highlightsUrls[index] }));
    }

    if (project.floorPlans && project.floorPlans.length > 0) {
        const floorPlansUrls = await getSignedUrlMultiple(project.floorPlans.map(item => item.url), PREFIXES.PROJECT_IMG_PREFIX);
        project.floorPlans = project.floorPlans.map((item, index) => ({ _id: item._id, url: floorPlansUrls[index] }));
    }
    if (project.videos && project.videos.length > 0) {
        const videosUrls = await getSignedUrlMultiple(project.videos.map(item => item.url), PREFIXES.PROJECT_VIDEOS_PREFIX);
        project.videos = project.videos.map((item, index) => ({ _id: item._id, url: videosUrls[index] }));
    }
    if (project.docs && project.docs.length > 0) {
        const docsUrls = await getSignedUrlMultiple(project.docs.map(item => item.url), PREFIXES.PROJECT_DOCS_PREFIX);
        project.docs = project.docs.map((item, index) => ({ _id: item._id, url: docsUrls[index] }));
    }
    return new SuccessResponse(httpStatus.OK, `project retrived successfully`, project).send(res);
});

const getProjects = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const filter = pick(req.query, ['title', 'reraId', 'contactNumber', 'location']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const projects = await projectService.queryProjects(filter, options);
    await checkUser(userRole, userId)
    return new SuccessResponse(httpStatus.OK, 'projects retrived successfully', projects).send(res);
});

const getProjectsByBuilder = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = userRole === RoleType.ADMIN && req.params.userId
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder Id");
    }
    await checkUser(userRole, userId, actualUserId)
    const builderProjects = await projectService.getProjectsByBuilderId(actualUserId);
    if (!builderProjects) {
        throw new ApiError(httpStatus.NOT_FOUND, `builder projects not found`);
    }
    return new SuccessResponse(httpStatus.OK, `projects retrived successfully`, builderProjects).send(res);
});

const updateProject = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const updateBody = req.body;
    const { _id: userId, role: userRole } = req.user;
    const adUserId = userRole === RoleType.ADMIN && req.params.userId
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    const updateBodyIds = {
        gallery: updateBody.gallery || [],
        highlights: updateBody.highlights || [],
        layout: updateBody.layout || [],
        floorPlans: updateBody.floorPlans || [],
        amenities: updateBody.amenities || [],
        videos: updateBody.videos || [],
        docs: updateBody.docs || []
    };

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }
    await checkUser(userRole, userId, actualUserId)
    const projectCheck = await projectService.getProjectById(projectId, actualUserId);
    if (!projectCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
    }

    const urlsToDelete = {
        gallery: [],
        highlights: [],
        layout: [],
        floorPlans: [],
        amenities: [],
        videos: [],
        docs: []
    };

    const keysToDelete = Object.keys(updateBodyIds).filter(key => updateBodyIds[key].length > 0);
    for (const key of keysToDelete) {
        const updateBodyItemIds = updateBodyIds[key].map(id => String(id));
        projectCheck[key] = projectCheck[key].filter(item => {
            if (!updateBodyItemIds.includes(String(item._id))) {
                return true;
            }
            urlsToDelete[key].push(item.url);
            return false;
        });
    }

    if (updateBody.employeeId) {
        const employee = await employeeService.getEmployeeBuilderAgentById(updateBody.employeeId, actualUserId);

        if (employee?.status === UserStatus.INACTIVE) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Employee status is inactive, unable to assign');
        }

        const isEmployeeAssigned = projectCheck.assignedEmployees.filter(empId => empId.equals(employee._id));
        if (isEmployeeAssigned.length > 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Employee is already assigned to the project');
        }

        await projectCheck.assignedEmployees.push(employee._id);
        await employee.assignedProjects.push(projectId);
        await employee.save();
        const project = await projectService.updateProjectById(projectId, projectCheck, actualUserId);
        return new SuccessResponse(httpStatus.OK, 'Employee assigned to project successfully', project).send(res);
    }

    const keys = Object.keys(urlsToDelete);
    for (const key of keys) {
        if (urlsToDelete[key] && urlsToDelete[key].length > 0) {
            console.log([{ url: `${determineKeyPrefix(key)}/${urlsToDelete[key]}` }])
            await s3DeleteMultiple([{ url: `${determineKeyPrefix(key)}/${urlsToDelete[key]}` }]);
        }
    }

    const updatedProjectData = {
        ...updateBodyIds,
        ...projectCheck,
    };

    // Merge text and other non-array fields
    Object.keys(updateBody).forEach(key => {
        if (!updateBodyIds.hasOwnProperty(key)) {
            updatedProjectData[key] = updateBody[key];
        }
    });

    // Only update specific arrays if they are present in updateBody
    keysToDelete.forEach(key => {
        updatedProjectData[key] = updateBodyIds[key];
    });

    const project = await projectService.updateProjectById(projectId, updatedProjectData, actualUserId);
    return new SuccessResponse(httpStatus.OK, `project updated successfully`, project).send(res);
});

const updateProjectImages = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const { _id: userId, role: userRole } = req.user;
    const adUserId = userRole === RoleType.ADMIN && req.params.userId
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder/agent Id");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid project Id");
    }

    const projectCheck = await projectService.getProjectById(projectId, actualUserId);

    if (!projectCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
    }

    const urlMap = {
        images: [],
        gallery: [],
        highlights: [],
        layout: [],
        floorPlans: [],
        amenities: [],
        videos: [],
        docs: []
    };

    if (req.files && Object.keys(req.files).length > 0) {
        const filesByPrefix = {};

        for (const key of Object.keys(req.files)) {
            const filesArray = req.files[key];
            if (Array.isArray(filesArray) && filesArray.length > 0) {
                console.log(`${key} are present and their count is:`, filesArray.length);

                for (const file of filesArray) {
                    const keyprefix = uploadKeyPrefix(file.mimetype);
                    if (!filesByPrefix[keyprefix]) {
                        filesByPrefix[keyprefix] = [];
                    }
                    filesByPrefix[keyprefix].push({
                        key: `spim-${Date.now()}-${file.originalname}`,
                        buffer: file.buffer,
                        contentType: file.mimetype,
                        fieldname: file.fieldname,
                        originalname: file.originalname
                    });
                }
            }
        }

        for (const prefix in filesByPrefix) {
            const filesToUpload = filesByPrefix[prefix];
            await s3UploadMultiple(filesToUpload, prefix);

            for (const file of filesToUpload) {
                const originalKey = file.fieldname;
                if (!urlMap[originalKey]) {
                    urlMap[originalKey] = [];
                }
                urlMap[originalKey].push({ url: file.key });
            }
        }
    }

    const updateFields = {};
    for (const key in urlMap) {
        if (urlMap[key].length > 0) {
            const existingImages = projectCheck[key] || [];
            updateFields[key] = existingImages.concat(urlMap[key]);
        }
    }

    const updatedProject = await projectService.updateProjectById(projectId, updateFields, actualUserId);

    return new SuccessResponse(httpStatus.OK, `project updated successfully`, updatedProject).send(res);
});

//access by builder
const deleteProject = catchAsync(async (req, res) => {
    const { projectId } = req.params
    const { _id: userId, role: userRole } = req.user;
    const adUserId = userRole === RoleType.ADMIN && req.params.userId
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "provide a valid builder/agent Id");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "provide a valid project Id");
    }
    await checkUser(userRole, userId, actualUserId)
    const findBuilder = await builderAgentService.getBuilderAgentById(actualUserId);
    const actualUserRole = userRole === RoleType.ADMIN ? findBuilder.role : userRole;

    const projectCheck = await projectService.getProjectById(projectId, actualUserId);
    if (!projectCheck) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
    }

    // const filesToDelete = [
    //     ...projectCheck.amenities.map(amenity => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${amenity.url}` })),
    //     ...projectCheck.highlights.map(highlight => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${highlight.url}` })),
    //     ...projectCheck.gallery.map(gallery => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${gallery.url}` })),
    //     ...projectCheck.layout.map(layout => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${layout.url}` })),
    //     ...projectCheck.floorPlans.map(floorPlan => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${floorPlan.url}` })),
    //     ...projectCheck.videos.map(video => ({ url: `${PREFIXES.PROJECT_VIDEOS_PREFIX}/${video.url}` })),
    //     ...projectCheck.docs.map(doc => ({ url: `${PREFIXES.PROJECT_DOCS_PREFIX}/${doc.url}` }))
    // ];

    // await s3DeleteMultiple(filesToDelete);

    if (projectCheck.amenities && projectCheck.amenities.length > 0) {
        await s3DeleteMultiple([...projectCheck.amenities.map(amenity => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${amenity.url}` }))])
    }
    if (projectCheck.highlights && projectCheck.highlights.length > 0) {
        await s3DeleteMultiple([...projectCheck.highlights.map(highlight => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${highlight.url}` }))])
    }
    if (projectCheck.gallery && projectCheck.gallery.length > 0) {
        await s3DeleteMultiple([...projectCheck.gallery.map(gallery => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${gallery.url}` }))])
    }
    if (projectCheck.layout && projectCheck.layout.length > 0) {
        await s3DeleteMultiple([...projectCheck.layout.map(layout => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${layout.url}` }))])
    }
    if (projectCheck.floorPlans && projectCheck.floorPlans.length > 0) {
        await s3DeleteMultiple([...projectCheck.floorPlans.map(floorPlan => ({ url: `${PREFIXES.PROJECT_IMG_PREFIX}/${floorPlan.url}` }))])
    }
    if (projectCheck.videos && projectCheck.videos.length > 0) {
        await s3DeleteMultiple([...projectCheck.videos.map(video => ({ url: `${PREFIXES.PROJECT_VIDEOS_PREFIX}/${video.url}` }))])
    }
    if (projectCheck.docs && projectCheck.docs.length > 0) {
        await s3DeleteMultiple([...projectCheck.docs.map(doc => ({ url: `${PREFIXES.PROJECT_DOCS_PREFIX}/${doc.url}` }))])
    }

    const builderUpdate = await builderAgentService.updateBuilderById(actualUserId, {
        $pull: { projects: projectId }
    }, actualUserRole);

    if (!builderUpdate || builderUpdate.nModified === 0) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update builder');
    }

    await projectService.deleteProjectById(projectId, actualUserId);
    return new SuccessResponse(httpStatus.OK, `${actualUserRole} project deleted successfully`).send(res);
});

const removeEmployeeFromProject = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const { employeeId } = req.query;
    const { projectId } = req.params
    const adUserId = req.params.userId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide valid Ids");
    }
    await checkUser(userRole, userId, actualUserId)
    let project = await projectService.getProjectById(projectId, actualUserId);
    if (!project) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
    }
    let employee = await employeeService.getEmployeeBuilderAgentById(employeeId, actualUserId);
    if (!employee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    }

    const employeeIndex = project.assignedEmployees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex === -1) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Employee not assigned to this project');
    }

    project.assignedEmployees = project.assignedEmployees.filter(emply => emply.id !== employeeId);
    const { assignedEmployees } = project

    await projectService.updateProjectById(projectId, { assignedEmployees: assignedEmployees }, actualUserId);

    employee.assignedProjects = employee.assignedProjects.filter(proj => proj.id !== projectId);
    const { assignedProjects } = employee

    await employeeService.updateEmployeeById(employeeId, { assignedProjects: assignedProjects }, actualUserId);

    return new SuccessResponse(httpStatus.OK, 'Employee removed from project successfully').send(res);
});

const getDashboardStatistics = catchAsync(async (req, res) => {
    const { _id: userId, role: userRole } = req.user;
    const adUserId = req.params.userId;
    const actualUserId = userRole === RoleType.ADMIN ? adUserId : userId;

    if (!mongoose.Types.ObjectId.isValid(actualUserId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Provide a valid builder Id");
    }

    const builderProjects = await projectService.getProjectsByBuilderId(actualUserId);
    if (!builderProjects) {
        throw new ApiError(httpStatus.NOT_FOUND, "Builder projects not found");
    }

    const statistics = {
        totalProjects: builderProjects.length,
        completedProjects: builderProjects.filter(project => project.status === ProjectStatus.COMPLETED).length,
        inProgressProjects: builderProjects.filter(project => project.status === ProjectStatus.IN_PROGRESS).length,
        preLaunchProjects: builderProjects.filter(project => project.status === ProjectStatus.PRE_LAUNCH).length,
        totalRevenue: builderProjects.reduce((sum, project) => sum + project.price, 0),
        totalGalleryImages: builderProjects.reduce((sum, project) => sum + (project.gallery?.length || 0), 0),
        totalAmenities: builderProjects.reduce((sum, project) => sum + (project.amenities?.length || 0), 0),
        totalAssignedEmployees: builderProjects.reduce((sum, project) => sum + (project.assignedEmployees?.length || 0), 0),
        totalHighlights: builderProjects.reduce((sum, project) => sum + (project.highlights?.length || 0), 0),
        totalLayouts: builderProjects.reduce((sum, project) => sum + (project.layout?.length || 0), 0),
        totalFloorPlans: builderProjects.reduce((sum, project) => sum + (project.floorPlans?.length || 0), 0),
        totalVideos: builderProjects.reduce((sum, project) => sum + (project.videos?.length || 0), 0),
        totalDocs: builderProjects.reduce((sum, project) => sum + (project.docs?.length || 0), 0),
    };


    return new SuccessResponse(httpStatus.OK, `project dashboard statistics retrieved successfully`, statistics).send(res);
});

module.exports = { createProject, getProject, getProjects, getProjectsByBuilder, updateProject, updateProjectImages, deleteProject, removeEmployeeFromProject, getDashboardStatistics }