const { result } = require('lodash');
const { query, startTransaction, endWithCommit, rollback } = require('./mysqlCon')

// 新增task前先檢查以防撞車
const checkNewTaskOrder = async (task) => {
    const result = await query(`SELECT id, name, section_id, task_order FROM task WHERE section_id = ? AND task_order = ?;`, [task.section_id, task.task_order]);
    return result;
}


const createTask = async (task) => {
    try {
        await startTransaction();
        const result = await query(`INSERT INTO task SET ?`,task);
        await endWithCommit();
        return result;
    } catch(error) {
        await rollback();
        return error;
    }
};

// 刪除task或新增task，並且update task順序
// 情境有三：
// 1. 刪除task並且update順序
// 2. 新增task並且update順序
// 3. 刪除與新增並且update順序
// 前端回傳的資訊應該只要有
/*  前端傳至後端的資料格式
{
    delete_task: {  // 從block中徹底刪除 (delete)
        id:
        task_order:
        section_id:
    } 
    move_task: {  // 將既有task挪至另一個block (update)
        id:  // 原本的id
        task_order:  // 新的order
        section_id:  // 新的section
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

// update task 的任何資訊前都要先確認task id存在
const checkTask = async (taskId) => {
    const result = await query(`SELECT id, name, section_id, task_order FROM task WHERE id = ?;`, taskId);
    return result;
}

const updateTaskOrder = async (data) => {
    const { deleteTask, moveTask, update } = data;

    let updateOriginSection = `UPDATE task SET task_order = task_order`;
    switch (update[0].move) {
        case 0: 
            updateOriginSection += `-1`;
            break;
        case 1:
            updateOriginSection += `+1`;
            break;            
    }
    updateOriginSection += ` WHERE section_id=? AND task_order BETWEEN ? AND ?;`;

    let updateNewSection;
    if (update.length === 2) {
        updateNewSection  = `UPDATE task SET task_order = task_order`;
        if (update[1].move) {
            updateNewSection += `+1 `;
        } else {
            updateNewSection += `-1 `;
        }
        updateNewSection += `WHERE section_id=? AND task_order BETWEEN ? AND ?;`;
    }

    const deleteQuery = `DELETE FROM task WHERE id=? AND task_order=? AND section_id=?;`;
    const moveQuery = `UPDATE task SET task_order=?, section_id=? WHERE id=?;`;

    try {
        await startTransaction();
        const updateOriginResult = await query(updateOriginSection, [update[0].section_id, update[0].from, update[0].end]);
        
        let updateNewResult;
        if (updateNewSection) {
            updateNewResult = await query(updateNewSection, [update[1].section_id, update[1].from, update[1].end])
        }

        let result;
        if (deleteTask) {
            result = await query(deleteQuery, [deleteTask.id, deleteTask.task_order, deleteTask.section_id]);
        }
        if (moveTask) {
            result = await query(moveQuery, [moveTask.task_order, moveTask.section_id, moveTask.id]);
        }
        
        await endWithCommit();
        return { updateOriginResult, updateNewResult, result };
    } catch(error) {
        await rollback();
        return error;
    }
}

const getTasks = async (sectionIds) => {
    const result = await query(`SELECT id, name, description, due_date, isComplete, section_id, task_order FROM task WHERE section_id IN (?) ORDER BY task_order;`, [sectionIds]);
    return result;
}

// task的id另外傳
// 會修改的頂多這四種
// {
//     name
//     description
//     due_date
//     isComplete
// }
const editTask = async (taskId, data) => {
    let query = `UPDATE task SET`;
    for (const key in data) {
        query += ` ${key} = ${data[key]},`;
    }
    // remove last comma from query
    let updateQuery = query.slice(0, -1);
    updateQuery += ` FROM task WHERE id = ?;`;

    try {
        await startTransaction();
        const result = await query(updateQuery, taskId);
        await endWithCommit();
        return result;
    } catch (error) {
        await rollback();
        return error;
    }
}

module.exports = { 
    checkNewTaskOrder,
    createTask,
    checkTask,
    updateTaskOrder,
    getTasks,
    editTask
};