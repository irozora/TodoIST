const router = require("express").Router();
const { wrapAsync } = require('../util/util');
const { createTask, updateTaskOrder, getTasks, getTask, editTask } = require("../controllers/task_controller");
const { authenticateToken } = require("../util/jwtToken");

// router.route('/task/create')
//     .post(wrapAsync(createTask));

router.route('/task/create')
    .post(wrapAsync(authenticateToken), wrapAsync(createTask));


// 加上authenticate的兩種寫法，目前測試都可行???
/*
// 第一種
router.route('/task/create')
    .post(wrapAsync(authenticateToken), wrapAsync(createTask));

// 第二種
router.route('/task/create')
    .all(wrapAsync(authenticateToken))
    .post(wrapAsync(createTask));
*/


router.route('/task/update')
    .post(wrapAsync(authenticateToken),wrapAsync(updateTaskOrder));

router.route('/task/list')
    .get(wrapAsync(getTasks));

router.route('/task/:id')
    .get(wrapAsync(getTask));

router.route('/task/:id')
    .post(wrapAsync(authenticateToken),wrapAsync(editTask));

module.exports = router;
