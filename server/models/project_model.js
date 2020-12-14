const { query, startTransaction, endWithCommit, rollback } = require('./mysqlCon')

const getProject = async (projectId) => {
    const result = await query(`SELECT id, name FROM project WHERE id = ?;`, projectId);
    return result;
}

const getProjects = async (email) => {
    const result = await query(`SELECT p.id, p.name FROM project p INNER JOIN user_project up WHERE p.id = up.project_id AND user_email =? AND isOwner = 1;`, email);
    return result;
}

module.exports = {
    getProject,
    getProjects
}