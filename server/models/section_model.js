const { query, startTransaction, endWithCommit, rollback } = require('./db')

const createSection = async (section) => {
    try {
        await startTransaction();
        const result = await query(`INSERT INTO section SET ?`,section);
        await endWithCommit();
        return result;
    } catch(error) {
        await rollback();
        return error;
    }
};

// update section 的任何資訊前都要先確認task id存在
const checkSection = async (sectionId) => {
    const result = await query(`SELECT id, name, section_id, task_order FROM task WHERE id = ?;`, sectionId);
    return result;
}

const updateSectionOrder = async (updateSection) => {
    const { moveSection, update } = updateSection;
    try {
        await startTransaction();

        await endWithCommit();
        return result;
    } catch(error) {
        await rollback();
        return error;
    }
}

module.exports = { 
    createSection,
    checkSection,
    updateSectionOrder
};