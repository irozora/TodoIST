const { query, startTransaction, endWithCommit, rollback } = require('./mysqlCon')

const createProject = async (project, email) => {
    try {
        await startTransaction();
        const projectResult = await query(`INSERT INTO project SET ?`, project);
        const projectId = projectResult.insertId;
        
        const user = {
            user_email: email,
            project_id: projectId,
            isOwner: 1 // 1 means is project owner
        }

        const owner = await query(`INSERT INTO user_project SET ?`, user);
        await endWithCommit();
        return { projectId, owner };
    } catch (error) {
        await rollback();
        return { error };
    }
}

const editProject = async (projectName, projectId) => {
    try {
        await startTransaction();
        const result = await query(`UPDATE project SET name = ? WHERE id = ?`, [projectName, projectId]);
        await endWithCommit();
        return result;
    } catch (error) {
        await rollback();
        return { error };
    }
}

const removeProject = async (email, projectId) => {
    try {
        await startTransaction();
        const removeOwnership = await query(`DELETE FROM user_project WHERE user_email = ? AND project_id = ? AND isOwner = 1;`, [email, projectId]);
        const removeProject = await query(`DELETE FROM project WHERE id =?;`, projectId)
        await endWithCommit();
        return { removeOwnership, removeProject };
    } catch (error) {
        await rollback();
        return { error };
    }
}

const checkProjectOwner = async (email, projectId) => {
    const result = await query(`SELECT id, user_email, project_id FROM user_project WHERE user_email = ? AND project_id = ?;`, [email, projectId]);
    return result;
}

const getProject = async (projectId) => {
    const result = await query(`SELECT id, name FROM project WHERE id = ?;`, projectId);
    return result;
}

const getProjects = async (email) => {
    const result = await query(`SELECT p.id, p.name FROM project p INNER JOIN user_project up WHERE p.id = up.project_id AND user_email =? AND isOwner = 1;`, email);
    return result;
}

module.exports = {
    createProject,
    editProject,
    removeProject,
    checkProjectOwner,
    getProject,
    getProjects
}