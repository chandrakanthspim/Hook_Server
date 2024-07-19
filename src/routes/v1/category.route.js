const express = require('express');
const auth = require('../../middlewares/auth');
const { categoryController } = require('../../controllers');
const { checkUserStatusMiddleware } = require('../../middlewares/status.check');
const router = express.Router();



router
    .route('/category/create-category')
    .post(auth('createCategory'), checkUserStatusMiddleware, categoryController.createCategory)

router.route('/category/get-categories').get(auth('getCategories'), checkUserStatusMiddleware, categoryController.getCategories);

router
    .route('/category/:categoryId')
    .get(auth('getCategory'), checkUserStatusMiddleware, categoryController.getCategory)
    .patch(auth('updateCategory'), checkUserStatusMiddleware, categoryController.updateCategory)
    .delete(auth('deleteCategory'), checkUserStatusMiddleware, categoryController.deleteCategory);

module.exports = router;