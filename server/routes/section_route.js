const router = require("express").Router();
const { wrapAsync } = require('../util/util');
const { createSection, updateSectionOrder, editSection } = require("../controllers/section_controller");
const { authenticateToken } = require("../util/jwtToken");

router.route('/section/create')
    .post(wrapAsync(authenticateToken),wrapAsync(createSection));

router.route('/section/update')
    .post(wrapAsync(authenticateToken),wrapAsync(updateSectionOrder));

router.route('/section/:id')
    .post(wrapAsync(authenticateToken),wrapAsync(editSection));

module.exports = router;
