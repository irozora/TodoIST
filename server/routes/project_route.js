const router = require("express").Router();
const { wrapAsync } = require('../util/util');
const { createProject, editProject, removeProject, getProject, getProjects } = require("../controllers/project_controller");
const { authenticateToken } = require("../util/jwtToken");

router.route('/project/create')
    .post(wrapAsync(authenticateToken), wrapAsync(createProject));

router.route('/project/:id')
    .get(wrapAsync(getProject));

router.route('/project/remove')
    .post(wrapAsync(authenticateToken), wrapAsync(removeProject));

router.route('/project/list')
    .post(wrapAsync(authenticateToken), wrapAsync(getProjects));

router.route('/project/:id')
    .post(wrapAsync(authenticateToken), wrapAsync(editProject));

module.exports = router;
