const Section = require("../models/section_model");

const createSection = async (req, res) => {
    const { name } = req.body;
    const section_order = Number(req.body.section_order);

    // 暫時寫死，db中要記得建id為1的project
    const project_id = Number(1);

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

module.exports = { 
    createSection
};