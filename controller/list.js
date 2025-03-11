const models = require("../models");

exports.countryList = async (req, res, next) => {
    try {
        let countryList = await models.country.findAll(
            {
                where: { status: "A" },
                attributes: ["id", "name", "phoneCode"]
            }
        );
        return res.status(200).send({
            success: true,
            message: "Country list",
            data: countryList
        });
    } catch (e) {
        return res.status(500).send({
            success: false,
            message: "Error in fetching country list",
            error: e.message
        });
    }
}
