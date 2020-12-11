const Section = require("../models/section_model");

const createSection = async (req, res) => {
    const { name } = req.body;
    const section_order = Number(req.body.section_order);
    const project_id = Number(req.body.project_id);

    const section = {
        name,
        section_order,
        project_id
    };

    const result = await Section.createSection(section);

    const { insertId } = result;
    if (!insertId) {
        return res.status(400).json({ error: result.code });
    }

    return res.status(200).send({ insertId });
}

// 移動task或刪除task，會改變順序的都打這支
const updateSectionOrder = async (req, res) => {
    const { delete_section, move_section, update } = req.body;

    if (!delete_section && !move_section) {
        return res.status(400).json({ error: "Please delete or move one section to update!" });
    }
    if (!update) {
        return res.status(400).json({ error: "Data required to update section order" });
    }

    let checkId;
    let action = delete_section || move_section;
    for (const key in action) {
        if (typeof action[key] !== 'number') {
            return res.status(400).json({ error: "Data type incorrect for altering task." });
        } else {
            checkId = action.id;
        }
    }

    const checkSection = await Section.checkSection(checkId);
    if (!checkSection.length) {
        return res.status(400).json({ error: "Requested section id does not exist. Please try another." });
    }

    const data = {
        deleteSection: delete_section,
        moveSection: move_section,
        update: update
    }

    const { result, sectionUpdate } = await Section.updateSectionOrder(data);

    if (result.errno || sectionUpdate.errno) {
        return res.status(400).json({ error: `Something wrong occur during update.` });
    }

    return res.status(200).json({ message: "Section order successfully updated!" });
}

// 需要section id與欲更換成的section name
const editSection = async (req, res) => {
    const { body } = req;
    const { name } = body;
    const sectionId = Number(req.params.id);

    const checkSection = await Section.checkSection(sectionId);
    if (!checkSection.length) {
        return res.status(400).json({ error: "Requested section id does not exist. Please try another." });
    }

    const result = await Section.editSection(sectionId, name);
    if (result.errno) {
        return res.status(400).json({ error: `Something is wrong for editing section name, please try another.` });
    }

    return res.status(200).json({ message: "Section name successfully updated!" });
}

module.exports = { 
    createSection,
    updateSectionOrder,
    editSection
};