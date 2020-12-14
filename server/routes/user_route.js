const router = require("express").Router();
const { wrapAsync } = require('../util/util');
const { signUp, signIn, getProfile } = require("../controllers/user_controller");
const { authenticateToken } = require("../util/jwtToken");

router.route('/user/signup')
    .post(wrapAsync(signUp));

router.route('/user/signin')
    .post(wrapAsync(signIn));

router.route('/user/profile')
    .post(wrapAsync(authenticateToken),wrapAsync(getProfile));

module.exports = router;
