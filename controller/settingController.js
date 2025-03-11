
const models = require("../models");
const { Op } = require("sequelize");
const niv = require("node-input-validator");

exports.createSetting = async (req, res) => {
  const v = new niv.Validator(req.body, {
    entry: "required|integer",
    playType: "required",
    multiplexList: "required",
  });
  const matched = await v.check();

  if (!matched) {
    return res.status(422).send({
      success: false,
      data: v.errors,
      message: "Invalid or missing parameters",
    });
  }

  try {
    const setting = await models.settings.findOne({
      where: { entry: req.body.entry, playType: req.body.playType, status: "A"}
    })

    if (setting) {
      return res.status(400).send({
        success: false,
        message: "Already created",
      });
    } else {
      let createdSettings = await models.settings.create({
        entry: req.body.entry,
        playType: req.body.playType,
      })

      for (let i = 0; i < req.body.multiplexList.length; i++) {
        await models.multiplexForEntry.create({
          entryId: createdSettings.id,
          correctNeeded: req.body.multiplexList[i].correctNeeded,
          multiplex: req.body.multiplexList[i].multiplex,
        })
      }
    }

    return res.status(200).send({
      success: true,
      message: "Added successfully",
      // data: error.message,
    });

  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "An error",
      error: error.message,
    });
  }

}

exports.updateSettings = async (req, res) => {
  // const v = new niv.Validator(req.body, {
  //   id: "required"
  // });
  // const matched = await v.check();

  // if (!matched) {
  //   return res.status(422).send({
  //     success: false,
  //     data: v.errors,
  //     message: "Invalid or missing parameters",
  //   });
  // }

  try {
    await models.multiplexForEntry.destroy({
      where: { entryId: req.params.id }
    })

    for (let i = 0; i < req.body.multiplexList.length; i++) {
      await models.multiplexForEntry.create({
        entryId: req.params.id,
        correctNeeded: req.body.multiplexList[i].correctNeeded,
        multiplex: req.body.multiplexList[i].multiplex,
      })
    }

    return res.status(200).send({
      success: true,
      message: "Updated successfully",
      // data: error.message,
    });

  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "An error",
      error: error.message,
    });
  }

}

exports.deleteSettings = async (req, res) => {
  try {
    await models.settings.update({
      status: "D"
    }, {
      where: { id: req.params.id }
    })
    return res.status(200).send({
      success: true,
      message: "Delete suceesfully",
      data: {},
    });
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "An error",
      error: e.message,
    });
  }
}

// use by admin
exports.updateSetting = async (req, res) => {
  try {
    const v = new niv.Validator(req.params, {
      id: "required|integer", // Validate the id parameter
    });
    const matched = await v.check();

    if (!matched) {
      return res.status(422).send({
        success: false,
        data: v.errors,
        message: "Invalid or missing parameters",
      });
    }

    const { id } = req.params; // Extract id from params
    const updateData = req.body; // Data to update

    // Validate that the updateData contains valid keys
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).send({
        success: false,
        message: "No update data provided",
      });
    }

    if (updateData.minimum > updateData.maximum) {
      return res.status(422).send({
        success: false,
        message: "Minimum must be less than minimum",
      });
    }

    // Find the setting by id
    const setting = await models.settings.findOne({
      where: { id },
    });

    // Check if the setting exists
    if (!setting) {
      return res.status(404).send({
        success: false,
        message: "Setting not found",
      });
    }

    // Update the setting
    const [updatedCount] = await models.settings.update(updateData, {
      where: { id },
    });

    if (updatedCount === 0) {
      return res.status(400).send({
        success: false,
        message: "Failed to update the setting",
      });
    }

    // Retrieve the updated setting
    const updatedSetting = await models.settings.findOne({
      where: { id },
    });

    return res.status(200).send({
      success: true,
      message: "Setting updated successfully",
      data: updatedSetting,
    });
  } catch (error) {
    console.error("Error in updateSetting:", error);
    return res.status(500).send({
      success: false,
      message: "An error occurred while updating the setting",
      error: error.message,
    });
  }
};

// use by admin/user
exports.getAllSetting = async (req, res) => {
  try {
    const perPage = +req.query.limit || 100;
    const page = +req.query.page || 1;
    const offset = (page - 1) * perPage;

    const { searchTerm } = req.query;

    const whereClause = {
      status: "A"
    };
    if (searchTerm) {
      whereClause.playType = {
        [Op.like]: `%${searchTerm}%`,
      };
    }

    const settings = await models.settings.findAll({
      where: whereClause,
      attributes: [
        "id",
        "playType",
        "entry",
        "status",
        "createdAt",
      ],
      include:{
          required: false,
          model: models.multiplexForEntry,
          as: "entryDetails",
          separate: true,
          where:{multiplex: {[Op.not]: 0}},
          order: [["correctNeeded", "ASC"]],
          // attributes: ["id", "profileImage", "playersId", "playerName"],
      },
      limit: perPage,
      offset: offset,
      order: [["entry", "ASC"]],
    });

    const count= await models.settings.count({
      where: whereClause,
    })

    return res.status(200).send({
      success: true,
      message: "Settings fetched successfully",
      data: {
        rows: settings,
        totalCount: count,
        perPage: perPage,
        currentPage: page,
      },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in fetching settings",
      error: error.message,
    });
  }
};

exports.getOneSetting = async (req, res) => {
  try {
    const setting = await models.settings.findOne({
      where: { id: req.params.id },
      include:{
        required: false,
        model: models.multiplexForEntry,
        as: "entryDetails",
        // attributes: ["id", "profileImage", "playersId", "playerName"],
    },
    });

    if (!setting) {
      return res.status(404).send({
        success: false,
        message: "Setting not found",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Setting retrieved successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Error in getOneSetting:", error);
    return res.status(500).send({
      success: false,
      message: "An error occurred while retrieving the setting",
      error: error.message,
    });
  }
};

exports.findSettingsForEntry = async (req, res) => {
  try {
    const { entry } = req.query;

    const setting = await models.settings.findAll({
      where: { entry: entry, status: "A" },
      include:{
        required: false,
        model: models.multiplexForEntry,
        as: "entryDetails",
        where:{multiplex: {[Op.not]: 0}},
        order: [["correctNeeded", "ASC"]]
      },
      order: [["playType", "ASC"]]
    });

    for (const item of setting) {
      if (item.entryDetails && item.entryDetails.length > 0) {
        item.entryDetails.sort((a, b) => b.correctNeeded - a.correctNeeded);
      }
    }
    
    return res.status(200).send({
      success: true,
      message: "Setting retrieved successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Error in getOneSetting:", error);
    return res.status(500).send({
      success: false,
      message: "An error occurred while retrieving the setting",
      error: error.message,
    });
  }
};

