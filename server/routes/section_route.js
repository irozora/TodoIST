const router = require("express").Router();
const { wrapAsync } = require('../../util/util');
const { createSection, updateSectionOrder } = require("../controllers/section_controller");

router.route('/section/create')
    .post(wrapAsync(createSection));

router.route('/section/update')
    .post(wrapAsync(updateSectionOrder));


module.exports = router;
