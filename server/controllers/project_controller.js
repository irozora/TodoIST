const Project = require("../models/project_model");

const createProject = async (req, res) => {
    const { email } = req;
    const { name } = req.body;
    if (!email) {
        res.status(400).send({error:'Authentication required to create project.'});
        return;
    }

    if (!name) {
        res.status(400).send({error:'Name required to create project.'});
        return;
    }

    const project = {
        name
    }

    const { projectId, owner } = await Project.createProject(project, email);

    if (!projectId || !owner) {
        return res.status(400).json({ error: `Something wrong occurred during project creating process.` });
    }

    return res.status(200).send({ projectId });
}

const editProject = async (req, res) => {
    const { email } = req;
    const { name } = req.body;
    const projectId = Number(req.params.id);

    const checkProjectOwner = await Project.checkProjectOwner(email, projectId);
    if (!checkProjectOwner.length) {
        return res.status(400).json({ error: "Only owners can edit projects." });
    }

    const checkProject = await Project.getProject(projectId);
    if (!checkProject.length) {
        return res.status(400).json({ error: "Requested project id does not exist. Please try another." });
    }

    const result = await Project.editProject(name, projectId);
    if (!result) {
        return res.status(400).json({ error: "Project name update failed." });
    }

    return res.status(200).json({ message: "Project name successfully updated!" });
}

const removeProject = async (req, res) => {
    const { email } = req;
    const projectId = Number(req.body.project_id);
    if (!email) {
        return res.status(400).json({ error: "Authentication required to remove project." });
    }

    const { removeOwnership, removeProject } = await Project.removeProject(email, projectId);
    if (!removeOwnership || !removeProject) {
        return res.status(400).json({ error: `Fail to remove project.` });
    }

    return res.status(200).json({ message: "Project removed successfully." });
}

const getProject = async (req, res) => {
    const projectId = Number(req.params.id);
    const data = await Project.getProject(projectId);

    if (data.errno) {
        return res.status(400).json({ error: `Something wrong occurred during data retrieve.` });
    }

    return res.status(200).send({ data });
}

const getProjects = async (req, res) => {
    const { email } = req;

    if (!email) {
        res.status(400).send({error:'Authentication required to get project lists.'});
        return;
    }

    const projects = await Project.getProjects(email);

    return res.status(200).send({ projects });
}


module.exports = {
    createProject,
    editProject,
    removeProject,
    getProject,
    getProjects
}