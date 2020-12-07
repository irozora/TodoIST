const router = require("express").Router();
const { wrapAsync } = require('../util/util');
const { createTask, updateTaskOrder, getTasks, editTask } = require("../controllers/task_controller");

router.route('/task/create')
    .post(wrapAsync(createTask));

router.route('/task/update')
    .post(wrapAsync(updateTaskOrder));

router.route('/task/list')
    .get(wrapAsync(getTasks));

router.route('/task/:id')
    .post(wrapAsync(editTask));

module.exports = router;
