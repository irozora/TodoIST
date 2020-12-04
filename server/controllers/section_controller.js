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
    if (typeof action.id !== "number" || typeof action.section_order !== "number") {
        return res.status(400).json({ error: "Data type incorrect for altering section." });
    } else {
        checkId = action.id;
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

module.exports = { 
    createSection,
    updateSectionOrder
};