const { query, startTransaction, endWithCommit, rollback } = require('./mysqlCon')

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

// update section 的任何資訊前都要先確認section id存在
const checkSection = async (sectionId) => {
    const result = await query(`SELECT id, name, project_id FROM section WHERE id = ?;`, sectionId);
    return result;
}

const updateSectionOrder = async (data) => {
    const { deleteSection, moveSection, update } = data;

    let updateQuery = `UPDATE section SET section_order = section_order`;
    switch(update.move) {
        case 0: 
            updateQuery += `-1`;
            break;
        case 1:
            updateQuery += `+1`;
            break;
    }
    updateQuery += ` WHERE project_id= ? AND section_order BETWEEN ? AND ?;`;

    try {
        await startTransaction();
        const sectionUpdate = await query(updateQuery, [update.project_id, update.from, update.end]);

        let result;
        if (deleteSection) {
            const deleteQuery = `DELETE FROM section WHERE id=?;`;
            result = await query(deleteQuery, [deleteSection.id]);
        }
        if (moveSection) {
            const moveQuery = `UPDATE section SET section_order= ? WHERE id= ?;`;
            result = await query(moveQuery, [moveSection.section_order, moveSection.id]);
        }
        await endWithCommit();
        return { sectionUpdate, result };
    } catch(error) {
        await rollback();
        return error;
    }
}

const getSections = async ( projectId ) => {
    const result = await query(`SELECT id, name, section_order FROM section WHERE project_id = ? ORDER BY section_order;`, projectId);
    return result;
}

module.exports = { 
    createSection,
    checkSection,
    updateSectionOrder,
    getSections
};