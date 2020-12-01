const router = require("express").Router();
const { wrapAsync } = require('../../util/util');
const { createSection } = require("../controllers/section_controller");

router.route('/section/create')
    .post(wrapAsync(createSection));

module.exports = router;
