
const models = require("../models");
const { Op } = require("sequelize");
const niv = require("node-input-validator");
const bcrypt = require("bcrypt");
const sequelize = require("sequelize");
const { generateJwtToken } = require("../function/common");
const { registerMail } = require("../function/mailSend");
const { checkCurrentResult } = require("../function/resultCalculation");

exports.login = async (req, res) => {
  const v = new niv.Validator(req.body, {
    email: "required|email",
    password: "required|string"
  });
  const matched = await v.check();

  if (!matched) {
    return res.status(200).send({
      success: false,
      data: v.errors,
      message: "must have all required field",
      status: 422,
    });
  }

  req.body.email = req.body.email.toLowerCase();
  let findUser;
  try {
    findUser = await models.user.findOne({
      where: { email: req.body.email, userType: "ADMIN" },
      attributes: ["id", "email", "password", "name", "userStatus"]
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "error, in finding user by email",
      error: error.message
    });
  }

  if (!findUser) {
    return res.status(400).send({
      success: false,
      message: "User is not found",
      error: {}
    });
  }

  if (findUser && bcrypt.compareSync(req.body.password, findUser?.password) && findUser.userStatus == "A") {
    let token = generateJwtToken(findUser.id);
    return res.status(200).send({
      success: true,
      status: 200,
      message: "Logged in successfully",
      data: {
        token: token,
        userDetails: findUser
      },
    });
  } else if (findUser && bcrypt.compareSync(req.body.password, findUser?.password) && findUser.userStatus != "A") {
    let otp = Math.floor(1000 + Math.random() * 9000);
    let otpValideTime = new Date(new Date().getTime() + 3 * 60000);
    try {
      await models.user.update(
        {
          otp: otp,
          otpValideTime: otpValideTime,
        },
        { where: { email: req.body.email } }
      );

    } catch (error) {
      return res.status(500).send({
        message: "Error in update user",
        error: error.message,
        status: false,
      });
    }
    //sent mail with otp here

    const mail = {
      to: req.body.email, //sendTo
      user: findUser.name || 'User',
      otp: otp,
    };
    registerMail(mail);
    let token = generateJwtToken(findUser.id);

    return res.status(403).send({
      // message: "User not active, please verify the OTP.",
      message: "User not found",
      status: false,
      data: {
        // token: token,
        userDetails: findUser,
      },
    });
  } else if (findUser && !bcrypt.compareSync(req.body.password, findUser?.password)) {
    return res.status(400).send({
      success: false,
      message: "Email or Password is not matching.",
      error: {}
    });
  }
};

exports.me = async (req, res, next) => {
  try {
    const userDetails = await models.user.findOne({
      attributes: ["id", "name", "email", "referralCode", "colorCode", "telegramId", "userStatus", "profileImage", "cc", "phone", "dob", "gender", "twoFactorEnable", "createdAt"],
      where: {
        id: req.authUser.id,
      },
      // include:
      // {
      //   required: false,
      //   model: models.address,
      //   as: "address",
      //   attributes: ["id", "streetAddress", "state", "country", "city", "status"],
      //   include:
      //   {
      //     required: false,
      //     model: models.country,
      //     as: "countryDetails",
      //     attributes: ["id", "name"]
      //   },
      // },
    });

    return res.status(200).send({
      status: true,
      data: userDetails,
      message: "admin details send successfully",
    });
  } catch (error) {
    console.log("error: ", error);
    return res.status(500).send({
      message: "error, me api",
      error: error.message,
      status: false,
    });
  }
};

exports.changePassword = async (req, res, next) => {
  const v = new niv.Validator(req.body, {
    oldPassword: "required|string",
    password: "required|string",
  });
  const matched = await v.check();

  if (!matched) {
    return res.status(422).send({
      message: "must have all required field",
      error: v.errors,
      status: false,
    });
  }

  try {

    if (req.body.oldPassword === req.body.password) {
      return res.status(400).send({
        success: false,
        message: "Old password is same as new password",
        error: {}
      });
    }

    let isMatched = bcrypt.compareSync(
      req.body.oldPassword,
      req.authUser.password
    );

    if (!isMatched) {
      return res.status(400).send({
        status: false,
        message: "Old password is not matching",
      });
    }

    let hashPassword = await bcrypt.hashSync(req.body.password, 10);
    await models.user.update(
      { password: hashPassword },
      { where: { id: req.authUser.id } }
    );
    return res.status(200).send({
      status: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    return res.status(500).send({
      message: "error occured",
      error: error.message,
      status: false,
    });
  }
};

exports.getAllUser = async (req, res, next) => {
  try {
    const perPage = +req?.query?.limit || 100;
    const page = +req?.query?.page || 1;
    const offset = (perPage * page) - perPage;

    const { userType, userStatus, searchTerm } = req.query;

    const whereClause = {
      isDeleted: false,
      userType: "USER"
    };

    // if (userType) {
    //   whereClause.userType = userType;
    // }

    if (userStatus) {
      whereClause.userStatus = userStatus;
    }

    if (searchTerm) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } },
        { phone: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    // Fetch users with pagination, filtering, and optional includes
    const users = await models.user.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "userType",
        "userStatus",
        "telegramId",
        "phone",
        "cc",
        "profileImage",
        "dob",
        "gender",
        "isDeleted",
        "createdAt",
        "updatedAt",
        "banned",
        "totalWithdrawals",
        "totalWagers",
        "totalDeposit",
        "ipAddress",
        "lastloginAt"
      ],
      where: whereClause,
      limit: perPage,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    // If no users are found, return an appropriate response
    if (!users || users.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No users found",
        data: {
          rows: [],
          totalCount: 0,
        },
      });
    }

    // Count total users matching the filters for pagination
    const usersCount = await models.user.count({
      where: whereClause,
    });

    return res.status(200).send({
      success: true,
      message: "Users fetched successfully",
      data: {
        rows: users,
        totalCount: usersCount,
      },
    });
  } catch (error) {
    console.error("Error in getAllUser: ", error);
    return res.status(500).send({
      success: false,
      message: "Error in getAllUser",
      error: error.message,
    });
  }
};

exports.getOneUser = async (req, res, next) => {
  // Validate input parameters
  const v = new niv.Validator(req.params, {
    id: "required|integer",
  });

  const matched = await v.check();

  if (!matched) {
    return res.status(422).send({
      success: false,
      data: v.errors,
      message: "Validation failed: must have all required fields",
      status: 422,
    });
  }

  try {
    const userId = req.params.id;

    // Find user by ID
    const userDetail = await models.user.findOne({
      where: { id: userId },
      attributes: [
        "id",
        "name",
        "email",
        "userType",
        "userStatus",
        "telegramId",
        "phone",
        "cc",
        "profileImage",
        "dob",
        "gender",
        "createdAt",
        "updatedAt",
        "banned",
        "totalWithdrawals",
        "totalWagers",
        "totalDeposit",
        "ipAddress",
        "lastloginAt"
      ],
      include: [
        {
          required: false,
          model: models.balance,
          as: "balance",
          attributes: ["id", "userId", "promoMoney", "depositMoney", "availablePromo", "availableBalance"]
        }
      ],
    });

    if (!userDetail) {
      return res.status(404).send({
        success: false,
        message: "User not found",
        data: null,
        status: 404,
      });
    }

    // Success response
    return res.status(200).send({
      success: true,
      message: "User retrieved successfully",
      data: userDetail,
      status: 200,
    });
  } catch (error) {
    console.error("Error in getOneUser: ", error);
    return res.status(500).send({
      success: false,
      message: "Error in getOneUser",
      data: error.message,
      status: 500,
    });
  }
};

exports.updateOneUser = async (req, res, next) => {
  // Validate input parameters
  const v = new niv.Validator(req.params, {
    id: "required|integer",
  });

  const matched = await v.check();

  if (!matched) {
    return res.status(422).send({
      success: false,
      data: v.errors,
      message: "Validation failed: must have all required fields",
      status: 422,
    });
  }

  try {
    const userId = req.params.id;

    // Destructure fields from request body
    const { name, email, userType, userStatus, telegramId, phone, cc, profileImage, dob, gender, banned } = req.body;

    // Update the user by ID
    const [updated] = await models.user.update(
      {
        name,
        email,
        userType,
        userStatus,
        telegramId,
        phone,
        cc,
        profileImage,
        dob: new Date(dob),
        gender,
        banned
      },
      { where: { id: userId } }
    );

    if (updated) {
      // Fetch the updated user details
      const updatedUser = await models.user.findOne({
        where: { id: userId },
        attributes: [
          "id",
          "name",
          "email",
          "userType",
          "userStatus",
          "telegramId",
          "phone",
          "cc",
          "profileImage",
          "dob",
          "gender",
          "createdAt",
          "updatedAt",
        ],
      });

      return res.status(200).send({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
        status: 200,
      });
    } else {
      return res.status(404).send({
        success: false,
        message: "User not found or no changes made",
        data: null,
        status: 404,
      });
    }
  } catch (error) {
    console.error("Error in updateOneUser: ", error);
    return res.status(500).send({
      success: false,
      message: "Error in updateOneUser",
      data: error.message,
      status: 500,
    });
  }
};

exports.deleteOneUser = async (req, res, next) => {
  try {
    // Validate the `id` parameter
    const v = new niv.Validator(req.params, {
      id: "required|integer",
    });

    const matched = await v.check();

    if (!matched) {
      return res.status(422).send({
        success: false,
        data: v.errors,
        message: "Validation failed: must have a valid `id` parameter",
        status: 422,
      });
    }

    const userId = req.params.id;

    // Check if the user exists and is not already deleted
    const user = await models.user.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found or already deleted",
        data: null,
        status: 404,
      });
    }

    // Perform the soft delete by updating the `isDeleted` field
    const updated = await models.user.update(
      { isDeleted: true },
      { where: { id: userId } }
    );

    if (updated) {
      return res.status(200).send({
        success: true,
        message: "User soft-deleted successfully",
        data: null,
        status: 200,
      });
    } else {
      return res.status(400).send({
        success: false,
        message: "Unable to soft delete user",
        data: null,
        status: 400,
      });
    }
  } catch (error) {
    console.error("Error in deleteOneUser: ", error);
    return res.status(500).send({
      success: false,
      message: "Error in deleteOneUser",
      data: error.message,
      status: 500,
    });
  }
};

exports.updateUserBalance = async (req, res, next) => {
  try {
    let balanceUpdate = await models.balance.findOne({
      where: { userId: req.params.userId }
    })
    await models.balanceUpdateLog.create({
      userId: req.params.userId,
      newBalance: req.body.amount,
      balanceWas: Number(balanceUpdate.availablePromo) + Number(balanceUpdate.availableBalance)
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in updating user balance",
      data: error.message,
      status: 500,
    });
  }

  try {
    await models.balance.update({
      availablePromo: 0,
      availableBalance: req.body.amount
    }, {
      where: {
        userId: req.params.userId
      }
    })
    return res.status(200).send({
      success: true,
      message: "Balance updated successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in updating user balance",
      data: error.message,
      status: 500,
    });
  }
}

exports.dailyUpdate = async (req, res, next) => {
  try {
    let allUser = await models.user.findAll({
      where: {
        userStatus: { [Op.in]: ["A", "I"] },
        userType: "USER",
        isDeleted: false
      },
      attributes: ["id", "userStatus"]
    })

    let today = new Date()
    let todaysDate = new Date(today.setHours(0, 0, 0, 0))
    let allLoginUser = await models.user.findAll({
      where: {
        lastloginAt: { [Op.gte]: todaysDate }
      },
      attributes: ["id", "lastloginAt"]
    })

    let depositAmount = await models.payment.findAll({
      where: {
        paymentMode: "DEPOSIT",
        paymentStatus: { [Op.in]: ["finished", "partially_paid"] },
        updatedAt: { [Op.gte]: todaysDate }
      },
      attributes: ["id", "priceAmount"]
    })

    let totalDeposit = 0
    for (const payment of depositAmount) {
      totalDeposit += parseFloat(payment.priceAmount || 0); // Ensure priceAmount is a float
    }

    let withdrawAmount = await models.payment.findAll({
      where: {
        paymentMode: "WITHDRAW",
        // paymentStatus: "finished",
        approveStatus: "APPROVED",
        updatedAt: { [Op.gte]: todaysDate }
      },
      attributes: ["id", "priceAmount"]
    })

    let totalWithdraw = 0
    for (const payment of withdrawAmount) {
      totalWithdraw += parseFloat(payment.priceAmount || 0); // Ensure priceAmount is a float
    }
    let totalBetPlaced = await models.betting.findAll({
      where: {
        createdAt: { [Op.gte]: todaysDate }
      },
      attributes: ["id"]
    })

    let allBalance = await models.balance.findAll({
      attributes: ["availablePromo", "availableBalance"]
    })
    let totalPromo = 0;
    let totalBalance = 0;
    let totalTressure = 0
    for (const balance of allBalance) {
      totalPromo += parseFloat(Number(balance.availablePromo) || 0);
      totalBalance += parseFloat(Number(balance.availableBalance) || 0);
    }

    let revenue = await models.betResultRecord.findAll({
      where: { createdAt: { [Op.gte]: todaysDate }, betStatus: { [Op.not]: "PENDING" } },
      attributes: ["winAmount", "betPlaced"]
    })

    let totalWin = 0
    let totalInvest = 0
    for (const r of revenue) {
      totalWin += parseFloat(Number(r.winAmount) || 0);
      totalInvest += parseFloat(Number(r.betPlaced) || 0);
    }

    return res.status(200).send({
      success: true,
      message: "Stat",
      data: {
        totalRegister: allUser.length,
        totalLogin: allLoginUser.length,
        totalDeposit: totalDeposit,
        totalWithdraw: totalWithdraw,
        totalBet: totalBetPlaced.length,
        totalTressure,
        profit: totalInvest - totalWin
      },
    });
  }
  catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in finding stat",
      data: error.message,
      status: 500,
    });
  }
}

/* --------------------------------------------- Sports --------------------------------------- */

exports.getAllSports = async (req, res) => {
  try {
    const perPage = +req.query.limit || 100;
    const page = +req.query.page || 1;
    const offset = (perPage * page) - perPage;

    const { searchTerm, status, type } = req.query;

    const whereClause = {
      status: { [Op.not]: "I" }
    };

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (searchTerm) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { shortName: { [Op.like]: `%${searchTerm}%` } },
        { type: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    const sports = await models.sports.findAll({
      attributes: ["id", "name", "shortName", "sportsId", "type", "icon", "status"],
      where: whereClause,
      limit: perPage,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    if (!sports || sports.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No sports found",
        data: {
          rows: [],
          totalCount: 0,
        },
      });
    }

    const sportsCount = await models.sports.count({
      where: whereClause,
    });

    return res.status(200).send({
      success: true,
      message: "Sports fetched successfully",
      data: {
        rows: sports,
        totalCount: sportsCount,
      },
    });
  } catch (error) {
    console.error("Error in getAllSports: ", error);
    return res.status(500).send({
      success: false,
      message: "Error in getAllSports",
      error: error.message,
    });
  }
};

exports.sportsStatusChange = async (req, res) => {
  try {
    await models.sports.update({
      status: req.body.status
    }, {
      where: { id: req.params.id }
    })
    return res.status(200).send({
      success: true,
      message: "Sports status updated",
      data: {},
      status: 200,
    });
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in sports status update",
      data: e.message,
      status: 500,
    });
  }
}

exports.gameList = async (req, res) => {
  const perPage = +req.query.limit || 100;
  const page = +req.query.page || 1;
  const offset = (perPage * page) - perPage;

  let allGames, count;
  try {
    allGames = await models.game.findAll({
      where: { sportsId: req.params.sportsId, startTime: { [Op.gte]: new Date() } },
      attributes: ["id", "sportsId", "competitionId", "gameId", "startTime", "startTimeConfirmed", "competitors1Id", "competitors1Name", "competitors1Country", "competitors1CountryCode",
        "competitors1Abbreviation", "competitors1Qualifier", "competitors1RotationNumber", "competitors2Id", "competitors2Name", "competitors2Country", "competitors2CountryCode", "competitors2Abbreviation", "competitors2Qualifier", "competitors2RotationNumber", "status"],
      order: [["createdAt", "DESC"]],
      limit: perPage,
      offset: offset,
    })
    count = await models.game.count({
      where: { sportsId: req.params.sportsId, startTime: { [Op.gte]: new Date() } }
    })

  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "error, in finding competition name",
      error: e.message
    });
  }
  return res.status(200).send({
    success: true,
    message: "All Competitions list",
    data: {
      rows: allGames,
      count: count
    }
  });
}

exports.gameStatusChange = async (req, res) => {
  try {
    await models.game.update({
      status: req.body.status
    }, {
      where: { id: req.params.id }
    })
    return res.status(200).send({
      success: true,
      message: "Games status updated",
      data: {},
      status: 200,
    });
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in sports status update",
      data: e.message,
      status: 500,
    });
  }
}

/* --------------------------------------------- Player List ---------------------------------- */

exports.getAllPlayerList = async (req, res) => {
  try {
    const perPage = +req.query.limit || 100; // Number of items per page, default to 100
    const page = +req.query.page || 1; // Current page, default to 1
    const offset = (perPage * page) - perPage; // Calculate offset

    const { searchTerm, status } = req.query;

    const whereClause = {};

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Search term filtering
    if (searchTerm) {
      whereClause[Op.or] = [
        { playerName: { [Op.like]: `%${searchTerm}%` } },
        { playersId: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    // Fetch players with pagination and filtering
    const players = await models.playerList.findAll({
      attributes: ["id", "playersId", "playerName", "profileImage", "status"],
      where: whereClause,
      limit: perPage,
      offset: offset,
      order: [["createdAt", "DESC"]], // Order by createdAt (newest first)
    });

    // If no players are found, return an appropriate response
    if (!players || players.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No players found",
        data: {
          rows: [],
          totalCount: 0,
        },
      });
    }

    // Count total players matching the filters for pagination
    const playersCount = await models.playerList.count({
      where: whereClause,
    });

    return res.status(200).send({
      success: true,
      message: "Players fetched successfully",
      data: {
        rows: players,
        totalCount: playersCount,
      },
    });
  } catch (error) {
    console.error("Error in getAllPlayerList: ", error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching players",
      error: error.message,
    });
  }
};

exports.getOnePlayerList = async (req, res) => {
  try {
    const player = await models.playerList.findOne({
      attributes: ["id", "playersId", "playerName", "profileImage", "status"],
      where: { playersId: req.params.id },
    });

    if (!player) {
      return res.status(400).send({
        success: false,
        message: "Player not found",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Player fetched successfully",
      data: player,
    });
  } catch (error) {
    console.error("Error in getOnePlayerList: ", error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching player",
      error: error.message,
    });
  }
};

exports.updateOnePlayerList = async (req, res) => {
  try {
    const updateData = req.body;

    const playerRecord = await models.playerList.findOne({
      where: { playersId: req.params.id },
    });

    if (!playerRecord) {
      return res.status(404).json({
        success: false,
        message: "Player not found.",
      });
    }

    const [updatedCount] = await models.playerList.update(updateData, {
      where: { playersId: req.params.id },
    });

    if (updatedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to update the player.",
      });
    }

    const updatedPlayer = await models.playerList.findOne({
      attributes: ["id", "playersId", "playerName", "profileImage", "status"],
      where: { playersId: req.params.id },
    });

    return res.status(200).json({
      success: true,
      message: "Player updated successfully.",
      data: updatedPlayer,
    });
  } catch (error) {
    console.error("Error in updateOnePlayerList:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the player.",
      error: error.message,
    });
  }
};

/* -------------------------------------------- Player ----------------------------------------- */

exports.getAllPlayers = async (req, res) => {
  try {
    const perPage = +req?.query?.limit || 100;
    const page = +req?.query?.page || 1;
    const offset = (perPage * page) - perPage;

    const { searchTerm } = req.query;
    const { sportsId } = req.params;

    // Where clause for the main `players` model
    const whereClause = {
      status: "A",
      sportsId: sportsId,
      // startTime: { [Op.gte]: new Date()}
    };

    // Where clause for the `playerDetais` model
    const playerDetailsWhereClause = {};

    // Apply search term for `playerName` or `playersId` in `playerDetais`
    if (searchTerm) {
      playerDetailsWhereClause[Op.or] = [
        { playerName: { [Op.like]: `%${searchTerm}%` } },
        { playersId: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    // Fetch players with the correct where clauses
    const allPlayers = await models.players.findAll({
      where: whereClause, // Main where clause for `players`
      attributes: [
        "id",
        "sportsId",
        "competitionId",
        "gameId",
        "playersId",
        "playerName",
        "competitorId",
        "startTime",
        "markets",
      ],
      include: [
        {
          required: false,
          model: models.game,
          as: "gameDetais",
          attributes: [
            "id",
            "competitionId",
            "gameId",
            "startTime",
            "competitors1Id",
            "competitors1Name",
            "competitors1Abbreviation",
            "competitors1Qualifier",
            "competitors1RotationNumber",
            "competitors2Id",
            "competitors2Name",
            "competitors2Abbreviation",
            "competitors2Qualifier",
            "competitors2RotationNumber",
          ],
        },
        {
          required: true, // Set `required: true` to filter by `playerDetais`
          model: models.playerList,
          as: "playerDetais",
          attributes: ["id", "profileImage", "playersId", "playerName"],
          where: playerDetailsWhereClause, // Filter `playerDetais` by `searchTerm`
        },
      ],
      group: ['playersId'],
      limit: perPage,
      offset: offset,
      order: [["createdAt", "DESC"]], // Optional: Order by creation date
    });

    // Check if no players found
    if (!allPlayers || allPlayers.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No players found",
        data: {
          rows: [],
          totalCount: 0,
        },
      });
    }
    let count = await models.players.findAll({
      where: whereClause, // Main where clause for `players`
      attributes: [
        "id",
        "sportsId",
        "competitionId",
        "gameId",
        "playersId",
        "playerName",
        "competitorId",
        "markets",
      ],
      include: [
        {
          required: false,
          model: models.game,
          as: "gameDetais",
          attributes: [
            "id",
            "competitionId",
            "gameId",
            "startTime",
            "competitors1Id",
            "competitors1Name",
            "competitors1Abbreviation",
            "competitors1Qualifier",
            "competitors1RotationNumber",
            "competitors2Id",
            "competitors2Name",
            "competitors2Abbreviation",
            "competitors2Qualifier",
            "competitors2RotationNumber",
          ],
        },
        {
          required: true, // Set `required: true` to filter by `playerDetais`
          model: models.playerList,
          as: "playerDetais",
          attributes: ["id", "profileImage", "playersId", "playerName"],
          where: playerDetailsWhereClause, // Filter `playerDetais` by `searchTerm`
        },
      ],
      group: ['playersId'],
    });

    // Return the result with pagination
    return res.status(200).send({
      success: true,
      message: "All Players list",
      data: {
        rows: allPlayers,
        totalCount: count.length,
        perPage: perPage,
        currentPage: page,
      },
    });
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in finding player details",
      error: e.message,
    });
  }
};

exports.tokenController = async (req, res) => {
  try {
    await models.admin.update({
      apiToken: req.body.apiToken
    }, {
      where: { id: 1 }
    })
    return res.status(200).send({
      success: true,
      message: "Token updated",
      data: {}
    });
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in updating ",
      error: e.message,
    });
  }
}

exports.tokenFetch = async (req, res) => {
  try {
    let tokenDetails = await models.admin.findOne({})
    return res.status(200).send({
      success: true,
      message: "Token updated",
      data: tokenDetails
    });
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in updating ",
      error: e.message,
    });
  }
}

exports.marketList = async (req, res) => {
  let allMarketList
  const perPage = +req?.query?.limit || 100;
  const page = +req?.query?.page || 1;
  const offset = (perPage * page) - perPage;

  const { searchTerm } = req.query;

  let whereClause = {
    sportsId: req.params.sportsId,
  }

  if (searchTerm) {
    whereClause = [Op.or] = [
      { marketName: { [Op.like]: `%${searchTerm}%` } },
      { marketShortName: { [Op.like]: `%${searchTerm}%` } },
    ];
  }

  try {
    allMarketList = await models.markets.findAll({
      where: whereClause,
      attributes: ["id", "sportsId", "marketName", "marketId", "marketShortName"],
      group: ["marketId"],
      limit: perPage,
      offset: offset,
    })

    let count = await models.markets.findAll({
      where: whereClause,
      attributes: ["id", "sportsId", "marketName", "marketId", "marketShortName"],
      group: ["marketId"],
    })

    return res.status(200).send({
      success: true,
      message: "All market list",
      data: {
        rows: allMarketList,
        count: count.length
      }
    });

  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in market list",
      error: e.message
    });
  }
}

exports.marketGetOne = async (req, res) => {
  let marketDetails
  try {
    marketDetails = await models.markets.findOne({
      where: { marketId: req.params.marketId, },
      attributes: ["id", "sportsId", "marketName", "marketId", "marketShortName"],
    })

    return res.status(200).send({
      success: true,
      message: "Market details",
      data: marketDetails
    });

  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in market list",
      error: e.message
    });
  }
}

exports.updateMarketName = async (req, res) => {
  try {
    await models.markets.update({
      marketShortName: req.body.marketShortName,
    }, {
      where: {
        marketId: req.params.marketId
      }
    })

    return res.status(200).send({
      success: true,
      message: "Update market name",
    });

  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in market list",
      error: e.message
    });
  }
}

exports.updateMarketStatus = async (req, res) => {
  try {
    await models.markets.update({
      status: req.body.status,
    }, {
      where: {
        marketId: req.params.marketId
      }
    })

    return res.status(200).send({
      success: true,
      message: "Update market name",
    });

  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in market list",
      error: e.message
    });
  }
}

exports.bettingList = async (req, res, next) => {
  const perPage = +req?.query?.limit || 100;
  const page = +req?.query?.page || 1;
  const offset = (perPage * page) - perPage;

  let whereClause = {
    userId: req.params.userId, status: "A"
  }
  if (req.query.bettingTime) {
    if (req.query.bettingTime == "past") {
      whereClause = {
        userId: req.params.userId, result: { [Op.in]: ["loss", "win", "refund"] }, status: "A"
      }
    } else {
      whereClause = {
        userId: req.params.userId, result: { [Op.in]: ["pending"] }, status: "A"
      }
    }
  }
  try {
    const bettingList = await models.betting.findAll({
      where: whereClause,
      include: [
        {
          required: true,
          model: models.betResultRecord,
          as: "resultDetails",
          attributes: ["id", "userId", "betId", "betPlaced", "winAmount", "result", "betStatus"]
        },
        {
          required: false,
          model: models.settings,
          as: "bettingDetais",
          // attributes: ["id", "playType", "minimum", "maximum", "minimumCorrectionNeeded", "minimumPoint", "maximumPoint"],
          include: {
            required: false,
            model: models.multiplexForEntry,
            as: "entryDetails",
            where: { multiplex: { [Op.not]: 0 } },
            order: ["correctNeeded", "DESC"]
            // attributes: ["id", "profileImage", "playersId", "playerName"],
          },
        },
        {
          required: false,
          model: models.bettingPlayers,
          as: "addedPlayers",
          attributes: ["id", "userId", "playerId", "betType", "bettingId", "beforePoint", "afterPoint", "marketId", "status"],
          include: [
            {
              required: true,
              model: models.players,
              as: "playerDetails",
              attributes: ["id", "sportsId", "competitionId", "gameId", "playersId", "playerListId", "playerName", "competitorId"],
              include: [
                {
                  required: false,
                  model: models.markets,
                  as: "marketDetails",
                  attributes: ["id",
                    "marketName",
                    "marketShortName",
                    "marketId",
                    "bookName",
                    "bookId", "oddsDecimal"]
                },
                {
                  required: false,
                  model: models.sports,
                  as: "sportDetais",
                  attributes: ["id", "shortName", "name"]
                },
                {
                  required: true,
                  model: models.game,
                  as: "gameDetais",
                  where: { status: "A" },
                  attributes: ["id", "competitionId", "gameId", "startTime", "competitors1Id", "competitors1Name", "competitors1Abbreviation", "competitors1Qualifier", "competitors1RotationNumber", "competitors2Id", "competitors2Name", "competitors2Abbreviation", "competitors2Qualifier", "competitors2RotationNumber", "status"]
                },
                {
                  required: true,
                  model: models.playerList,
                  as: "playerDetais",
                  attributes: ["id", "profileImage", "playersId", "playerName"],
                },
              ]
            }
          ]
        },
      ],
      order: [["createdAt", "DESC"]],
      // offset: offset,
      // limit: perPage,
    })

    bettingList.forEach(betting => {
      const bettingDetails = Array.isArray(betting.bettingDetais) ? betting.bettingDetais : [betting.bettingDetais].filter(Boolean);

      bettingDetails.forEach(setting => {
        if (setting.entryDetails && setting.entryDetails.length > 0) {
          setting.entryDetails.sort((a, b) => b.correctNeeded - a.correctNeeded);
        }
      });
    });

    return res.status(200).json({
      success: true,
      message: "All bet list",
      data: bettingList
    });
  } catch (e) {
    console.log(e)
    return res.status(500).json({
      success: false,
      message: "Error in finding exist betting",
      error: e.message,
    });
  }
}

exports.bettingDetails = async (req, res, next) => {
  try {
    const bettingList = await models.betting.findOne({
      where: { id: req.params.betId },
      include: [
        {
          required: true,
          model: models.betResultRecord,
          as: "resultDetails",
          attributes: ["id", "userId", "betId", "betPlaced", "winAmount", "result", "betStatus"]
        },
        {
          required: false,
          model: models.settings,
          as: "bettingDetais",
          // attributes: ["id", "playType", "minimum", "maximum", "minimumCorrectionNeeded", "minimumPoint", "maximumPoint"],
          include: {
            required: false,
            model: models.multiplexForEntry,
            as: "entryDetails",
            where: { multiplex: { [Op.not]: 0 } },
            order: ["correctNeeded", "DESC"]
            // attributes: ["id", "profileImage", "playersId", "playerName"],
          },
        },
        {
          required: false,
          model: models.inBetSettings,
          as: "inBetBettingDetais",
          // attributes: ["id", "playType", "minimum", "maximum", "minimumCorrectionNeeded", "minimumPoint", "maximumPoint"],
          include: {
            required: false,
            model: models.inBetMultiplexForEntry,
            as: "entryDetails",
            where: { multiplex: { [Op.not]: 0 } },
            order: ["correctNeeded", "DESC"]
            // attributes: ["id", "profileImage", "playersId", "playerName"],
          },
        },
        {
          required: true,
          model: models.bettingPlayers,
          as: "addedPlayers",
          // where: { status: "A" },
          attributes: ["id", "userId", "playerId", "betType", "bettingId", "beforePoint", "afterPoint", "marketId", "status"],
          include: [
            {
              required: false,
              model: models.markets,
              as: "marketDetails",
              attributes: ["id",
                "marketName",
                "marketShortName",
                "marketId",
                "bookName",
                "bookId",
                "bookTotalValue"]
            },
            {
              required: true,
              model: models.players,
              as: "playerDetails",
              attributes: ["id", "sportsId", "competitionId", "gameId", "playersId", "playerListId", "playerName", "competitorId"],
              include: [
                {
                  required: false,
                  model: models.sports,
                  as: "sportDetais",
                  attributes: ["id", "shortName", "name"]
                },
                {
                  required: true,
                  model: models.game,
                  as: "gameDetais",
                  where: { status: "A" },
                  attributes: ["id", "competitionId", "gameId", "startTime", "competitors1Id", "competitors1Name", "competitors1Abbreviation", "competitors1Qualifier", "competitors1RotationNumber", "competitors2Id", "competitors2Name", "competitors2Abbreviation", "competitors2Qualifier", "competitors2RotationNumber", "status", "resultFound"]
                },
                {
                  required: true,
                  model: models.playerList,
                  as: "playerDetais",
                  attributes: ["id", "profileImage", "playersId", "playerName"],
                },
              ]
            }
          ]
        },
      ],
      order: [
        // ["createdAt", "DESC"],
        [{ model: models.settings, as: "bettingDetais" }, { model: models.multiplexForEntry, as: "entryDetails" }, "correctNeeded", "DESC"]]
    })

    // if (bettingList?.dataValues?.bettingDetais?.datavLaues?.entryDetails?.length > 0) {
    //   console.log("huhuj")
    //   bettingList.bettingDetais.entryDetails = bettingList.bettingDetais.entryDetails.sort(
    //     (a, b) => b.correctNeeded - a.correctNeeded
    //   );
    // }


    for (let i = 0; i < bettingList.dataValues.addedPlayers.length; i++) {
      console.log(bettingList.dataValues.addedPlayers[i].dataValues.marketId)
      let findResult = await checkCurrentResult(bettingList.dataValues.addedPlayers[i].dataValues.marketId, bettingList.dataValues.addedPlayers[i].dataValues.playerDetails.dataValues.playersId)
      console.log(findResult)
      try {
        await models.bettingPlayers.update({
          afterPoint: findResult
        }, {
          where: {
            id: bettingList.dataValues.addedPlayers[i].dataValues.id
          }
        })
        bettingList.dataValues.addedPlayers[i].dataValues.afterPoint = findResult
      } catch (e) {
        console.log(e)
      }
    }

    return res.status(200).json({
      success: true,
      message: "All bet list",
      data: bettingList
    });
  } catch (e) {
    console.log(e)
    return res.status(500).json({
      success: false,
      message: "Error in finding exist betting",
    });
  }
}

exports.withdrawRequestList = async (req, res, next) => {
  try {
    const perPage = +req?.query?.limit || 100;
    const page = +req?.query?.page || 1;
    const offset = (perPage * page) - perPage;

    let whereClause = {
      paymentType: {
        [Op.or]: ["WITHDRAW"]
      },
      // approveStatus: "PENDING"
    };
    if (req.query.userId) {
      whereClause.userId = req.query.userId
    }

    const withdrawReq = await models.payment.findAndCountAll({
      where: whereClause,
      // attributes: ["id", "userId", "priceAmount", "paymentType", "createdAt", "promoById"],
      offset: offset,
      limit: perPage,
      order: [["createdAt", "DESC"]], // Sort by most recent promos
      include: [
        {
          model: models.user,
          as: "userDetails",
          attributes: ["id", "name", "email"], // Adjust based on what you need
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Withdraw request list fetched successfully",
      data: withdrawReq.rows,
      pagination: {
        totalRecords: withdrawReq.count,
        currentPage: page,
        totalPages: Math.ceil(withdrawReq.count / perPage),
        perPage: perPage,
      },
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error fetching withdrawReq",
      error: error.message,
      success: false,
    });
  }
}