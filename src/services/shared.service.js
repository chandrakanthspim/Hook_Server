const mongoose = require('mongoose');
const { Builder, Project, Employee } = require('../models');
const { getSignedUrlMultiple } = require('./s3.service');
const { PREFIXES } = require('../utils/constants');

// retrive builder details/agent (optional)
// arg as builderId/agentId
const retrieveBuilder = async (builderId) => {
  const result = {
    success: true,
    message: 'None',
    data: {},
  };

  try {
    if (!builderId) {
      throw new Error('Invalid builder ID');
    }

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      throw new Error('Please provide a valid mongoose ID');
    }

    const builderDetails = await Builder.findById(builderId).select('-password -createdAt -updatedAt -__v');
    if (!builderDetails) {
      result.success = false;
      result.message = 'No builder found with the given ID';
    } else {
      result.data = builderDetails;
      result.message = 'Builder retrieved successfully';
    }
  } catch (error) {
    console.log(error);
    result.success = false;
    result.message = error.message || 'An error occurred';
  }

  console.log('result', result);
  return result;
};

// retrieveBuilder('6668202271c05b0d9865c6c2');

// retrive all categories under the builder based on builder/agent Id and cityId
// arg as builderId/agentId & cityId
const retrieveCategoriesByCity = async (builderId, cityId) => {
  const result = {
    success: true,
    message: 'None',
    data: [],
  };

  try {
    if (!builderId || !cityId) {
      throw new Error('Both builderId and cityId are required');
    }

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      throw new Error('Please provide a valid mongoose builderId');
    }

    const projectDetails = await Project.find({ createdBy: builderId, city: cityId })
      .select('category -_id')
      .populate('category', 'name -_id');

    if (projectDetails.length === 0) {
      result.success = false;
      result.message = 'No projects found with the given builderId and cityId';
    } else {
      result.data = projectDetails;
      result.message = 'Projects retrieved successfully';
    }
  } catch (error) {
    console.error('Error in retrieveBuilderProjects:', error.message);
    result.success = false;
    result.message = error.message || 'An error occurred';
  }

  console.log('result', result);
  return result;
};

// retrieveCategoriesByCity('6668202271c05b0d9865c6c2', '667277c86a71c30114bf38f6');

// retrive all projects under the builder based on builder/agent Id and cityId
// arg as builderId/agentId
const retrieveProjectsByCity = async (builderId, cityId) => {
  const result = {
    success: true,
    message: 'None',
    data: [],
  };

  try {
    if (!builderId || !cityId) {
      throw new Error('Both builderId and cityId are required');
    }

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      throw new Error('Please provide a valid mongoose builderId');
    }

    const projectDetails = await Project.find({ createdBy: builderId, city: cityId }).select('-createdAt -updatedAt -__v');

    if (projectDetails.length === 0) {
      result.success = false;
      result.message = 'No projects found with the given builderId and cityId';
    } else {
      result.data = projectDetails;
      result.message = 'Projects retrieved successfully';
    }
  } catch (error) {
    console.error('Error in retrieveBuilderProjects:', error.message);
    result.success = false;
    result.message = error.message || 'An error occurred';
  }

  console.log('result', result);
  return result;
};

// retrieveProjectsByCity('6668202271c05b0d9865c6c2', '667279b06a71c30114bf395b');

// retrive project location based on builder Id & category Id
// arg as builderId & categoryId
const retrieveProjectsLocationByCategory = async (builderId, categoryId) => {
  const result = {
    success: true,
    message: 'None',
    data: [],
  };

  try {
    if (!builderId) {
      throw new Error('Both builderId and cityId are required');
    }

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      throw new Error('Please provide a valid mongoose builderId');
    }

    const projectDetails = await Project.find({ createdBy: builderId, category: categoryId })
      .populate('country', 'name -_id')
      .populate('state', 'name -_id')
      .populate('city', 'name -_id');

    if (projectDetails.length === 0) {
      result.success = false;
      result.message = 'No projects found with the given builderId and cityId';
    } else {
      const uniqueLocations = {};
      projectDetails.forEach((project) => {
        const key = project.city.name;
        if (!uniqueLocations[key]) {
          uniqueLocations[key] = {
            city: project.city.name,
          };
        }
      });

      result.data = Object.values(uniqueLocations);
      result.message = 'Projects locations retrieved successfully';
    }
  } catch (error) {
    console.error('Error in retrieveBuilderProjects:', error.message);
    result.success = false;
    result.message = error.message || 'An error occurred';
  }

  console.log('result', result);
  return result;
};

// retrieveProjectsLocationByCategory('664cb08bcc14ab46a04955b0', '6671300ef9f6d43290b94407');

// retrive projects based on builderId and categoryId
// arg as builderId & categoryId
const retrieveProjectByCategory = async (builderId, categoryId) => {
  const result = {
    success: true,
    message: 'None',
    data: {},
  };

  try {
    if (!categoryId) {
      throw new Error('Please provide type name');
    }

    const projectDetails = await Project.find({ createdBy: builderId, category: categoryId })
      .select('-createdAt -updatedAt -__v')
      .populate('country', 'name -_id')
      .populate('state', 'name -_id')
      .populate('city', 'name -_id')
      .populate('category', 'name -_id');

    if (!projectDetails || projectDetails.length == 0) {
      result.success = false;
      result.message = 'No project found with the given type';
    } else {
      result.data = projectDetails;
      result.message = 'Project retrieved successfully';
    }
  } catch (error) {
    console.log(error);
    result.success = false;
    result.message = error.message || 'An error occurred';
  }
  console.log('result', result);
  return result;
};

// retrieveProjectByCategory('6668202271c05b0d9865c6c2', '6671300ef9f6d43290b94407');

// retrive project categories based on builder Id
// arg as builder Id
const retriveProjectCategory = async (builderId, locationId = null) => {
  const result = {
    success: true,
    message: 'None',
    data: [],
  };

  try {
    if (!builderId) {
      throw new Error('Both builderId and cityId are required');
    }

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      throw new Error('Please provide a valid mongoose builderId');
    }

    const query = Project.find({ createdBy: builderId }).populate('category', 'name _id');

    if (locationId) {
      query.where('city', locationId);
    }
    const projectDetails = await query;

    if (projectDetails.length === 0) {
      result.success = false;
      result.message = 'No projects found with the given builderId and cityId';
    } else {
      const uniqueLocations = {};

      projectDetails.forEach((project) => {
        const key = project.category ? project.category._id : '';
        uniqueLocations[key] = {
          id: key,
          name: project.category ? project.category.name : '',
        };
      });

      result.data = Object.values(uniqueLocations);
      result.message = 'Projects categories retrived successfully';
    }
  } catch (error) {
    console.error('Error in retrieveBuilderProjects:', error.message);
    result.success = false;
    result.message = error.message || 'An error occurred';
  }

  console.log('result', result);
  return result;
};

// retriveProjectCategory('6668202271c05b0d9865c6c2');

// retrive project locations based on builder Id
// arg as builder Id
const retrieveProjectsLocation = async (builderId, categoryId = null) => {
  const result = {
    success: true,
    message: 'None',
    data: [],
  };

  try {
    if (!builderId) {
      throw new Error('Both builderId and cityId are required');
    }

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      throw new Error('Please provide a valid mongoose builderId');
    }

    const query = Project.find({ createdBy: builderId })
      .populate('country', 'name _id')
      .populate('state', 'name _id')
      .populate('city', 'name _id')
      .populate('category', 'name _id');

    if (categoryId) {
      query.where('category', categoryId);
    }

    const projectDetails = await query;

    console.log('project details', projectDetails);
    if (projectDetails.length === 0) {
      result.success = false;
      result.message = 'No projects found with the given builderId and cityId';
    } else {
      const uniqueLocations = {};
      projectDetails.forEach((project) => {
        const key = project.city ? project.city._id : '';
        uniqueLocations[key] = {
          id: key,
          name: project.city ? project.city.name : '',
        };
      });

      result.data = Object.values(uniqueLocations);
      result.message = 'Projects retrieved successfully';
    }
  } catch (error) {
    console.error('Error in retrieveBuilderProjects:', error.message);
    result.success = false;
    result.message = error.message || 'An error occurred';
  }

  console.log('result', result);
  return result;
};

// retrieveProjectsLocation('6668202271c05b0d9865c6c2');

// retrive all projects under the builder based on builder/agent Id
// arg as builderId/agentId
const retrieveProjects = async (builderId, categoryId = null, locationId = null) => {
  const result = {
    success: true,
    message: 'None',
    data: [],
  };

  try {
    if (!builderId) {
      throw new Error('Both builderId and cityId are required');
    }

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      throw new Error('Please provide a valid mongoose builderId');
    }

    const query = Project.find({ createdBy: builderId })
      .select('-createdAt -updatedAt -__v')
      .populate('country', 'name _id')
      .populate('state', 'name _id')
      .populate('city', 'name _id')
      .populate('category', 'name _id');

    if (categoryId) {
      query.where('category', categoryId);
    }
    if (locationId) {
      query.where('city', locationId);
    }
    const projectDetails = await query;

    if (projectDetails.length === 0) {
      result.success = false;
      result.message = 'No projects found with the given builderId and cityId';
    } else {
      result.data = projectDetails.map((project) => {
        return { id: project._id, name: project.title };
      });
      result.message = 'Projects retrieved successfully';
    }
  } catch (error) {
    console.error('Error in retrieveBuilderProjects:', error.message);
    result.success = false;
    result.message = error.message || 'An error occurred';
  }

  console.log('result', result);
  return result;
};

// retrieveProjects('6668202271c05b0d9865c6c2');

// retrive all employees under builder/agent
// arg as builderId
const retrieveEmployee = async (builderId) => {
  const result = {
    success: true,
    message: 'None',
    data: {},
  };

  try {
    if (!builderId) {
      throw new Error('Invalid employee ID');
    }

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      throw new Error('Please provide a valid mongoose ID');
    }

    const employeeDetails = await Employee.find({ createdBy: builderId }).select('-password -createdAt -updatedAt -__v');
    if (!employeeDetails) {
      result.success = false;
      result.message = 'No employee found with the given ID';
    } else {
      result.data = employeeDetails;
      result.message = 'Employees retrieved successfully';
    }
  } catch (error) {
    console.log(error);
    result.success = false;
    result.message = error.message || 'An error occurred';
  }

  console.log('result', result);
  return result;
};

// retrieveEmployee('6668202271c05b0d9865c6c2');

// retrive single project
// arg as project Id
const retrieveProject = async (projectId) => {
  const result = {
    success: true,
    message: 'None',
    data: {},
  };

  try {
    if (!projectId) {
      throw new Error('Invalid project ID');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error('Please provide a valid mongoose ID');
    }

    const project = await Project.findById(projectId)
      .select('-createdAt -updatedAt -__v')
      .populate('country', 'name -_id')
      .populate('state', 'name -_id')
      .populate('city', 'name -_id')
      .populate('category', 'name -_id');

    if (!project) {
      result.success = false;
      result.message = 'No project found with the given project Id';
    } else {
      result.data = project.toObject();

      const getSignedUrls = async (items, prefix) => {
        if (items && items.length > 0) {
          const urls = await getSignedUrlMultiple(
            items.map((item) => item.url),
            prefix
          );
          return items.map((item, index) => ({ _id: item._id, url: urls[index] }));
        }
        return [];
      };

      result.data.images = await getSignedUrls(result.data.images, PREFIXES.PROJECT_IMG_PREFIX);
      result.data.gallery = await getSignedUrls(result.data.gallery, PREFIXES.PROJECT_IMG_PREFIX);
      result.data.amenities = await getSignedUrls(result.data.amenities, PREFIXES.PROJECT_IMG_PREFIX);
      result.data.layout = await getSignedUrls(result.data.layout, PREFIXES.PROJECT_IMG_PREFIX);
      result.data.highlights = await getSignedUrls(result.data.highlights, PREFIXES.PROJECT_IMG_PREFIX);
      result.data.floorPlans = await getSignedUrls(result.data.floorPlans, PREFIXES.PROJECT_IMG_PREFIX);
      result.data.videos = await getSignedUrls(result.data.videos, PREFIXES.PROJECT_VIDEOS_PREFIX);
      result.data.docs = await getSignedUrls(result.data.docs, PREFIXES.PROJECT_DOCS_PREFIX);

      result.message = 'Project retrieved successfully';
    }
  } catch (error) {
    console.error(error);
    result.success = false;
    result.message = error.message || 'An error occurred';
  }

  console.log('result', result);
  return result;
};

// retrieveProject('667278996a71c30114bf394b');

// retrive single project
// arg as projectId & queryField
const retrieveProjectByIdQuery = async (projectId, queryField = null) => {
  const result = {
    success: true,
    message: 'None',
    data: {},
  };

  try {
    if (!projectId) {
      throw new Error('Invalid project ID');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error('Please provide a valid mongoose ID');
    }

    let selectFields = '-createdAt -updatedAt -__v';
    if (queryField) {
      selectFields = queryField.split(',').join(' ');
    }

    const project = await Project.findById(projectId)
      .select(selectFields)
      .populate('country', 'name -_id')
      .populate('state', 'name -_id')
      .populate('city', 'name -_id')
      .populate('category', 'name -_id');

    if (!project) {
      result.success = false;
      result.message = 'No project found with the given project Id';
    } else {
      result.data = project.toObject();

      const getSignedUrls = async (items, prefix) => {
        if (items && items.length > 0) {
          const urls = await getSignedUrlMultiple(
            items.map((item) => item.url),
            prefix
          );
          return items.map((item, index) => ({ _id: item._id, url: urls[index] }));
        }
        return [];
      };

      const updateSignedUrls = async (field, prefix) => {
        if (result.data[field]) {
          result.data[field] = await getSignedUrls(result.data[field], prefix);
        }
      };

      await updateSignedUrls('images', PREFIXES.PROJECT_IMG_PREFIX);
      await updateSignedUrls('gallery', PREFIXES.PROJECT_IMG_PREFIX);
      await updateSignedUrls('amenities', PREFIXES.PROJECT_IMG_PREFIX);
      await updateSignedUrls('layout', PREFIXES.PROJECT_IMG_PREFIX);
      await updateSignedUrls('highlights', PREFIXES.PROJECT_IMG_PREFIX);
      await updateSignedUrls('floorPlans', PREFIXES.PROJECT_IMG_PREFIX);
      await updateSignedUrls('videos', PREFIXES.PROJECT_VIDEOS_PREFIX);
      await updateSignedUrls('docs', PREFIXES.PROJECT_DOCS_PREFIX);

      result.message = 'Project retrieved successfully';
    }
  } catch (error) {
    console.error(error);
    result.success = false;
    result.message = error.message || 'An error occurred';
  }

  console.log('result', result);
  return result;
};


// retrieveProjectByIdQuery('667280d5910f7e3d00d9152d',"gallery");

module.exports = {
  retrieveProjectsLocation,
  retrieveProjects,
  retriveProjectCategory,
  retrieveCategoriesByCity,
  retrieveProjectsByCity,
  retrieveProjectsLocationByCategory,
  retrieveBuilder,
  retrieveProject,
};
