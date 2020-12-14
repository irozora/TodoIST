const router = require("express").Router();
const { wrapAsync } = require('../util/util');
const { getProject, getProjects } = require("../controllers/project_controller");
const { authenticateToken } = require("../util/jwtToken");

router.route('/project/:id')
    .get(wrapAsync(getProject));

router.route('/project/list')
    .post(wrapAsync(authenticateToken), wrapAsync(getProjects));

module.exports = router;
