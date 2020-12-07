const _ = require('lodash');
const Task = require("../models/task_model");
const Section = require('../models/section_model')

// 單純新增task的功能，需要加上section_id，目前前端沒有拋相關資訊過來
const createTask = async (req, res) => {
    const { body } = req;
    const { name, description, dueDate } = body;
    const task_order = Number(body.task_order);
    const section_id = Number(body.section_id);

    const task = {
        name,
        task_order,
        section_id
    };

    if (description) {
        task.description = description;
    }

    if (dueDate) {
        task.due_date = dueDate;
    }

    const newTaskOrder = await Task.checkNewTaskOrder(task);
    if (newTaskOrder.length) {
        return res.status(400).json({ error: "Combination of task order and section id already exist." });
    }

    const result = await Task.createTask(task);
    const { insertId } = result;
    if (!insertId) {
        return res.status(400).json({ error: result.code });
    }

    return res.status(200).send({ insertId });
};

// 刪除task或新增task，並且update task順序
// 情境有三：
// 1. 刪除task並且update順序
// 2. 新增task並且update順序
// 3. 刪除與新增並且update順序
// 前端回傳的資訊應該只要有
/*
{
    delete_task: {  // 被挪動的目標task，從block中徹底刪除
        id:
        task_order:
        section_id:
    } 
    move_task: {  // 被挪動的目標task，將既有task挪至另一個block
        id:
        task_order:  
        section_id:
    }
    update: [
        {  // update 原本的block
            move: 0 or 1 (1 for +1, 0 for -1)
            section_id:
            from: (原本的order) 
            end:  (原本的order)
        },
        {  // update 另外一個block
            move: 0 or 1 (1 for +1, 0 for -1)
            section_id:
            from: (order) 
            end:  (order)
        }
    ]
}
*/

// 移動task或刪除task，會改變順序的都打這支
const updateTaskOrder = async (req, res) => {
    const { delete_task, move_task, update } = req.body;

    if (!delete_task && !move_task) {
        return res.status(400).json({ error: "Please delete or add one task to update!" });
    }
    
    if (!update) {
        return res.status(400).json({ error: "Data required to update task order" });
    }

    let checkId;
    let action = delete_task || move_task;
    if (typeof action.id !== "number" || typeof action.task_order !== "number"|| typeof action.section_id !== "number") {
        return res.status(400).json({ error: "Data type incorrect for altering task." });
    } else {
        checkId = action.id;
    }

    for (let i = 0; i < update.length; i ++) {
        let currentUpdate = update[i];
        if (typeof currentUpdate.move !== "number" || typeof currentUpdate.section_id !== "number" || typeof currentUpdate.from !== "number" || typeof currentUpdate.end !== "number") {
            return res.status(400).json({ error: "Data type incorrect for updating task." });
        }
    }

    const checkTask = await Task.checkTask(checkId);
    if (!checkTask.length) {
        return res.status(400).json({ error: "Requested task id does not exist. Please try another." });
    }

    const data = {
        deleteTask: delete_task,
        moveTask: move_task,
        update: update
    };

    const { updateOriginResult, result } = await Task.updateTaskOrder(data);

    if (updateOriginResult.errno || result.errno) {
        return res.status(400).json({ error: `Something wrong occur during update.` });
    }

    return res.status(200).json({ message: "Task order successfully updated!" });
}

// 撈task資料，還需要別的參數
const getTasks = async (req, res) => {
    const projectId = Number(req.query.id);

    let data = await Section.getSections(projectId);

    if (!data.length) {
        return res.status(200).send({ data: {} });
    } else {
        data = await getTasksWithDetail(data);
    }

    return res.status(200).send({ data });
};

const getTasksWithDetail = async (data) => {
    const sectionIds = data.map(s => s.id);
    const tasks = await Task.getTasks(sectionIds);
    const tasksMap = _.groupBy(tasks, t => t.section_id);

    return data.map(s => {
        const tasksOfSection = tasksMap[s.id];
        
        if (!tasksOfSection) {
            return s;
        }

        s.tasks = tasksOfSection.map(t => ({
            task_id: t.id,
            name: t.name,
            description: t.description,
            task_order: t.task_order
        }))

        return s;
    })
}

module.exports = { 
    createTask,
    updateTaskOrder,
    getTasks
};