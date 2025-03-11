const models = require("../models");
const niv = require("node-input-validator");
const sequelize = require("sequelize");
const Op = sequelize.Op;

exports.getTerms = async (req, res) => {
  try {
    let terms = await models.termsOfService.findOne({
      where: {
        id: 1
      }
    })
    return res.status(200).json({
      success: true,
      data: terms,
      message: "Terms of service fetched succeesfully"
    })
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Error in fetching terms",
    });
  }
}

exports.updateTerms = async (req, res) => {
  try {
    let terms = await models.termsOfService.update({
      terms: req.body.terms
    }, {
      where: {
        id: 1
      }
    })
    return res.status(200).json({
      success: true,
      // data: terms,
      message: "Terms of service updated succeesfully"
    })
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Error in updateing terms",
    });
  }
}

exports.getPrivacy = async (req, res) => {
  try {
    let privacyAndPolicy = await models.privacy.findOne({
      where: {
        id: 1
      }
    })
    return res.status(200).json({
      success: true,
      data: privacyAndPolicy,
      message: "Privacy and policy fetched succeesfully"
    })
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Error in fetching terms",
    });
  }
}

exports.updatePrivacy = async (req, res) => {
  try {
    await models.privacy.update({
      privacy: req.body.privacy
    }, {
      where: {
        id: 1
      }
    })
    return res.status(200).json({
      success: true,
      message: "Privacy and policy updated succeesfully"
    })
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Error in updateing terms",
    });
  }
}

exports.getHelp = async (req, res) => {
  try {
    let helpData = await models.help.findOne({
      where: {
        id: 1
      }
    })
    return res.status(200).json({
      success: true,
      data: helpData,
      message: "Help data fetched succeesfully"
    })
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Error in fetching help",
    });
  }
}

exports.updateHelp = async (req, res) => {
  try {
    await models.help.update({
      help: req.body.help
    }, {
      where: {
        id: 1
      }
    })
    return res.status(200).json({
      success: true,
      message: "Help data updated succeesfully"
    })
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Error in updateing help",
    });
  }
}

// ======================================================================= FAQ ==========================================================

exports.createFaq = async (req, res) => {
  try {
    // Validate the input fields
    const v = new niv.Validator(req.body, {
      question: "required|string",
      answer: "required|string",
    });

    const matched = await v.check();

    if (!matched) {
      return res.status(422).send({
        success: false,
        data: v.errors,
        message: "Validation failed. Please provide all required fields.",
        status: 422,
      });
    }

    const newFaq = await models.fag.create({
      question: req.body.question,
      answer: req.body.answer,
      status: req.body.status || 'A', 
      isDeleted: req.body.isDeleted || false,
    });

    return res.status(200).send({
      success: true,
      data: newFaq,
      message: "FAQ created successfully",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error while creating FAQ",
      error: error.message,
      success: false,
    });
  }
};

exports.getAllFaq = async (req, res) => {
  try {
    const perPage = +req?.query?.limit || 10; // Default to 10 items per page
    const page = +req?.query?.page || 1; // Default to page 1
    const offset = (page - 1) * perPage;

    const { searchTerm, status, isDeleted } = req.query;

    // Building the where clause for filtering
    const whereClause = {
      status: 'A'
    };
    if (status) {
      whereClause.status = status; // Filter by status (e.g., "A", "I", "C")
    }

    if (searchTerm) {
      whereClause.question = {
        [Op.like]: `%${searchTerm}%`,
      };
    }

    // Fetch paginated FAQs from the database
    const faqs = await models.fag.findAll({
      attributes: ["id", "question", "answer", "status", "isDeleted", "createdAt", "updatedAt"],
      where: whereClause,
      limit: perPage,
      offset: offset,
      order: [["createdAt", "DESC"]], // Sort by most recent FAQs
    });

    // Count total FAQs matching the filters
    const totalFaqs = await models.fag.count({
      where: whereClause,
    });

    return res.status(200).send({
      success: true,
      message: "FAQs fetched successfully.",
      data: {
        rows: faqs,
        totalCount: totalFaqs,
      },
      status: 200,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error in getAllFaq",
      error: error.message,
      success: false,
    });
  }
};

exports.getOneFaq = async (req, res) => {
  const v = new niv.Validator(req.params, {
    faqId: "required|integer",
  });

  const matched = await v.check();

  if (!matched) {
    return res.status(422).send({
      success: false,
      data: v.errors,
      message: "Validation failed: Provide a valid faqId",
      status: 422,
    });
  }

  try {
    const { faqId } = req.params;

    const faq = await models.fag.findOne({
      where: { id: faqId },
      attributes: ["id", "question", "answer", "status", "isDeleted", "createdAt", "updatedAt"],
    });

    if (!faq) {
      return res.status(404).send({
        success: false,
        message: "FAQ not found",
        status: 404,
      });
    }

    return res.status(200).send({
      success: true,
      message: "FAQ fetched successfully",
      data: faq,
      status: 200,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in getOneFaq",
      error: error.message,
    });
  }
};

exports.updateFaq = async (req, res) => {
  const v = new niv.Validator(req.params, {
    faqId: "required|integer",
  });

  const matched = await v.check();

  if (!matched) {
    return res.status(422).send({
      success: false,
      data: v.errors,
      message: "Validation failed: Provide a valid faqId",
      status: 422,
    });
  }

  try {
    const { faqId } = req.params;
    const { question, answer, status } = req.body;

    const [updated] = await models.fag.update(
      { question, answer, status },
      { where: { id: faqId } }
    );

    if (!updated) {
      return res.status(404).send({
        success: false,
        message: "FAQ not found or no changes made",
        status: 404,
      });
    }

    const updatedFaq = await models.fag.findOne({
      where: { id: faqId },
      attributes: ["id", "question", "answer", "status", "isDeleted", "createdAt", "updatedAt"],
    });

    return res.status(200).send({
      success: true,
      message: "FAQ updated successfully",
      data: updatedFaq,
      status: 200,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in updateFaq",
      error: error.message,
    });
  }
};

exports.deleteFaq = async (req, res) => {
  const v = new niv.Validator(req.params, {
    faqId: "required|integer",
  });

  const matched = await v.check();

  if (!matched) {
    return res.status(422).send({
      success: false,
      data: v.errors,
      message: "Validation failed: Provide a valid faqId",
      status: 422,
    });
  }

  try {
    const { faqId } = req.params;

    const [updated] = await models.fag.update(
      {
        isDeleted: true,
        status: "C",
      },
      { where: { id: faqId } }
    );

    if (!updated) {
      return res.status(404).send({
        success: false,
        message: "FAQ not found",
        status: 404,
      });
    }

    return res.status(200).send({
      success: true,
      message: "FAQ deleted successfully",
      status: 200,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in deleteFaq",
      error: error.message,
    });
  }
};
