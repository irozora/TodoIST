const Section = require("../models/section_model");

const createSection = async (req, res) => {
    console.log(req.body);
    const { name } = req.body;
    const section_order = Number(req.body.section_order);

    const section = {
        name,
        section_order
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