const multer = require('multer');
const storage = multer.memoryStorage()
const upload = multer({
    storage: storage, limits: {
        fileSize: 30 * 1024 * 1024, // 30 limit for  files
    },
})

const Gender = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHERS: 'OTHERS'
};

const ProjectStatus = {
    PRE_LAUNCH: 'PRE_LAUNCH',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
};

const UserStatus = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    BLOCK: 'BLOCK'
};

const PlanStatus = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    ON_HOLD: 'ON_HOLD',
};

const PlanType = {
    FREE: 'FREE',
    SILVER: 'SILVER',
    GOLD: 'GOLD',
    DIAMOND: 'DIAMOND'
};

const PlanUnit = {
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY'
}

const RoleType = {
    ADMIN: 'admin',
    BUILDER: 'builder',
    AGENT: 'agent'
}

const ProjectType = {
    RESIDENTIAL: 'RESIDENTIAL_APARTMENTS',
    COMMERCIAL: 'COMMERCIAL',
    VILLAS: 'VILLAS',
    FARM_LAND: 'FARM_LAND',
    PLOTTING: 'PLOTTING'
}

const ApprovalType = {
    RERA: "RERA",
    HMDA: "HMDA",
    DTCP: "DTCP",
    NONE: null
}

const projectUploads = upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'gallery', maxCount: 5 },
    { name: 'highlights', maxCount: 5 },
    { name: 'layout', maxCount: 5 },
    { name: 'floorPlans', maxCount: 5 },
    { name: 'amenities', maxCount: 5 },
    { name: 'videos', maxCount: 5 },
    { name: 'docs', maxCount: 5 },
])

const apartmentUploads = upload.fields([
    { name: 'planImage', maxCount: 1 },
    { name: 'planSvg', maxCount: 1 },
    { name: 'towerImage', maxCount: 1 },
    { name: 'towerSvg', maxCount: 1 },
    { name: 'floorImage', maxCount: 1 },
    { name: 'floorSvg', maxCount: 1 },
    { name: 'flatImage', maxCount: 1 },
    { name: 'flatSvg', maxCount: 1 }
])

const plottingUploads = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'plotSvg', maxCount: 1 },
    { name: 'plotImage', maxCount: 1 },
    { name: 'mapImage', maxCount: 1 },
    { name: 'highlightsImage', maxCount: 1 },
]);

const PREFIXES = {
    PROJECT_IMG_PREFIX: 'project/images',
    PROJECT_VIDEOS_PREFIX: 'project/videos',
    PROJECT_DOCS_PREFIX: 'project/docs',

    PLOTTING_SVG_PREFIX: 'plotting/svg',
    PLOTTING_LOGO_PREFIX: 'plotting/logo',
    PLOTTING_IMG_PREFIX: 'plotting/image',

    APARTMENT_IMG_PREFIX: 'apartments/images',
    APARTMENT_SVG_PREFIX: 'apartments/svgs'
}

module.exports = { UserStatus, ProjectStatus, Gender, PlanStatus, PlanType, PlanUnit, RoleType, ProjectType, ApprovalType, projectUploads, apartmentUploads, plottingUploads, PREFIXES };
