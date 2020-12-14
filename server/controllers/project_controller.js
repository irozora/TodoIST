const Project = require("../models/project_model");

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
    getProject,
    getProjects
}