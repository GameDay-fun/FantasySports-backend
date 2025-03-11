const models = require("../models");
const niv = require("node-input-validator");
const bcrypt = require("bcrypt");
const sequelize = require("sequelize");
const { generateJwtToken } = require("../function/common");
const { registerMail, sendInviteMail } = require("../function/mailSend");
const randomstring = require("randomstring");
const fs = require('fs');
const path = require('path');
const AWS = require("aws-sdk");
const Op = sequelize.Op;

AWS.config.update({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_ZONE,
  acl: "public-read",
});
const s3 = new AWS.S3();
let promoForInvite = 15
exports.register = async (req, res) => {
  const v = new niv.Validator(req.body, {
    name: "required|string",
    email: "required|email",
    password: "required|string",
    // telegramId: "string",
    referralCode: "string"
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

  let randomCode = randomstring.generate({
    length: 7,
    charset: 'alphanumeric'
  });

  let codeCreatedByUserId;
  if (req.body.referralCode) {
    let findInviter = await models.user.findOne({
      where: {
        userOwnReferralCode: req.body.referralCode
      }
    });
    if (!findInviter) {
      return res.status(400).send({
        success: false,
        message: "Invalid Referral Code.",
        data: null
      });
    }
    codeCreatedByUserId = findInviter?.id;
  }

  // // -------------------------------- OLD code ---------------------
  // let codeCreatedByUserId;
  // if (req.body.referralCode) {
  //   let findInviter = await models.userInvite.findOne({
  //     where: { code: req.body.referralCode }
  //   });
  //   if (!findInviter) {
  //     return res.status(400).send({
  //       success: false,
  //       message: "Invalid Referral Code.",
  //       data: null
  //     });
  //   }
  //   codeCreatedByUserId = findInviter?.userId;
  // }

  req.body.email = req.body.email.toLowerCase();

  let findUserByEmail;
  try {
    findUserByEmail = await models.user.findOne({
      where: { email: req.body.email },
      attributes: ["id", "email", "name", "otp", "otpValideTime", "userStatus"]
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "error, in finding user by email",
      error: error.message
    });
  }

  let nameExist = await models.user.findOne({
    where: { name: req.body.name },
    attributes: ["id", "name"]
  })

  if (nameExist) {
    return res.status(400).send({
      success: false,
      message: "This username is taken.",
      data: nameExist
    });
  }

  if (findUserByEmail) {
    if (findUserByEmail.userStatus == "A" || findUserByEmail.userStatus == "D") {
      return res.status(400).send({
        success: false,
        message: "User already exist with same email",
        error: req.body.email,
      });
    } else {
      let otp = Math.floor(1000 + Math.random() * 9000);
      let otpValideTime = new Date(new Date().getTime() + 3 * 60000);

      findUserByEmail.otp = otp;
      findUserByEmail.otpValideTime = otpValideTime;
      findUserByEmail.name = req.body.name;
      findUserByEmail.password = await bcrypt.hashSync(req.body.password, 10);
      await findUserByEmail.save();

      const mail = {
        to: req.body.email,
        otp: otp,
        user: findUserByEmail.name || 'User'
      };
      registerMail(mail);

      return res.status(200).send({
        success: true,
        message: "User has registered successfully",
        data: findUserByEmail
      });
    }
  }

  let createUser;
  try {
    createUser = await models.user.create({
      name: req.body.name,
      email: req.body.email,
      password: await bcrypt.hashSync(req.body.password, 10),
      referralCode: req.body.referralCode,
      codeCreatedByUserId: codeCreatedByUserId,
      userOwnReferralCode: "PR-" + randomCode
    })

    let colorCodes;
    try {
      colorCodes = await models.colorCode.findAll({})
    } catch (e) {
      return res.status(500).send({
        message: "Error in finding color code",
        error: e.message,
        status: false
      });
    }
    let randomColorCode = colorCodes[Math.floor(1 + Math.random() * colorCodes.length)]
    let otp = Math.floor(1000 + Math.random() * 9000);
    let otpValideTime = new Date(new Date().getTime() + 3 * 60000);

    createUser.otp = otp;
    createUser.otpValideTime = otpValideTime;
    createUser.colorCode = randomColorCode ? randomColorCode.code : "#FF335E";
    await createUser.save();

    const mail = {
      to: req.body.email,
      otp: otp,
      user: req.body.name || 'User'
    };
    registerMail(mail);
  } catch (error) {
    return res.status(200).send({
      success: false,
      message: "error, in creating user",
      error: error.message,
    });
  }

  try {
    await models.balance.create({
      userId: createUser.id
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in create balance table",
      error: e.message
    });
  }

  // if (req.body.referralCode) {
  //   try {
  //     let findInviter = await models.userInvite.findOne({
  //       where: { code: req.body.referralCode }
  //     })
  //     if (findInviter && findInviter.promoGiven == false) {
  //       await models.payment.create({
  //         userId: findInviter.userId,
  //         priceAmount: promoForInvite,
  //         paymentType: "PROMO",
  //         promoById: createUser.id,
  //         description: "For reference " + req.body.referralCode
  //       });
  //       await models.userInvite.update({
  //         promoGiven: true
  //       }, {
  //         where: {
  //           id: findInviter.id
  //         }
  //       })

  //       let userDetails = await models.user.findOne({
  //         where: { id: findInviter.userId },
  //         attributes: ["id", "walletBalance", "availableBalance", "promo"]
  //       });

  //       let walletBalance = Number(userDetails.walletBalance) + Number(promoForInvite)
  //       console.log("walletBalance", walletBalance)
  //       let availableBalance = Number(userDetails.availableBalance) + Number(promoForInvite)
  //       console.log("availableBalance", availableBalance)
  //       let promo = Number(userDetails.promo) + Number(promoForInvite)
  //       console.log("promo", promo)
  //       console.log("findInviter.userId", findInviter.userId)
  //       await models.user.update({
  //         walletBalance: walletBalance,
  //         availableBalance: availableBalance,
  //         promo: promo
  //       }, {
  //         where: {
  //           id: findInviter.userId
  //         }
  //       });
  //     }
  //   } catch (e) {
  //     return res.status(500).send({
  //       success: false,
  //       message: "Error in given promo for referring",
  //     });
  //   }
  // }

  // if (req.body.referralCode) {
  //   try {
  //     let findInviter = await models.user.findOne({
  //       where: { userOwnReferralCode: req.body.referralCode }
  //     })
  //     // if (findInviter && findInviter.promoGiven == false) {
  //     if (findInviter) {
  //       await models.payment.create({
  //         userId: findInviter.id,
  //         priceAmount: promoForInvite,
  //         paymentType: "PROMO",
  //         promoById: createUser.id,
  //         description: "For reference " + req.body.referralCode
  //       });
  //       // await models.userInvite.update({
  //       //   promoGiven: true
  //       // }, {
  //       //   where: {
  //       //     id: findInviter.id
  //       //   }
  //       // })

  //       let userDetails = await models.user.findOne({
  //         where: { id: findInviter.id },
  //         attributes: ["id", "walletBalance", "availableBalance", "promo"]
  //       });

  //       let walletBalance = Number(userDetails.walletBalance) + Number(promoForInvite)
  //       console.log("walletBalance", walletBalance)
  //       let availableBalance = Number(userDetails.availableBalance) + Number(promoForInvite)
  //       console.log("availableBalance", availableBalance)
  //       let promo = Number(userDetails.promo) + Number(promoForInvite)
  //       console.log("promo", promo)
  //       console.log("findInviter.id", findInviter.id)
  //       await models.user.update({
  //         walletBalance: walletBalance,
  //         availableBalance: availableBalance,
  //         promo: promo
  //       }, {
  //         where: {
  //           id: findInviter.id
  //         }
  //       });
  //     }
  //   } catch (e) {
  //     return res.status(500).send({
  //       success: false,
  //       message: "Error in given promo for referring",
  //     });
  //   }
  // }

  return res.status(200).send({
    success: true,
    message: "User has registered successfully",
    data: createUser
  });
}

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
  const clientIp = req.ipInfo.ip
  console.log(".........",clientIp)
  req.body.email = req.body.email.toLowerCase();
  let findUser;
  try {
    findUser = await models.user.findOne({
      where: { email: req.body.email },
      attributes: ["id", "email", "password", "name", "userStatus", "isDeleted", "is2fa", "banned"]
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

  // console.log("findUser: ", findUser);

  if (findUser && findUser.isDeleted == true) {
    return res.status(400).send({
      success: false,
      message: "User is deleted",
      error: {}
    });
  }

  if (findUser && findUser.banned == true) {
    return res.status(400).send({
      success: false,
      message: "You have banned from this site",
      error: {}
    });
  }

  // sending otp for 2FA
  if (findUser && findUser.is2fa == true) {
    console.log("sending otp for 2FA");
    let otp = Math.floor(1000 + Math.random() * 9000);
    let otpValideTime = new Date(new Date().getTime() + 3 * 60000);

    findUser.otp = otp;
    findUser.otpValideTime = otpValideTime;
    await findUser.save();

    const userDetail = await models.user.findOne({
      where: { email: req.body.email },
      attributes: ["id", "email", "name", "userStatus", "isDeleted", "is2fa", "userOwnReferralCode", "referralCode"]
    })

    const mail = {
      to: req.body.email,
      otp: otp,
      user: findUser.name || 'User'
    };
    registerMail(mail);

    return res.status(200).send({
      success: true,
      message: "otp sent successfully",
      data: userDetail
    });
  }
  console.log("Traditonal Login");

  if (findUser && bcrypt.compareSync(req.body.password, findUser?.password) && findUser.userStatus == "A") {
    const userDetail = await models.user.findOne({
      where: { email: req.body.email },
      attributes: ["id", "email", "name", "userStatus", "isDeleted", "is2fa", "userOwnReferralCode", "referralCode"]
    })
    await models.user.update({
      lastloginAt: new Date(),
      ipAddress: clientIp
    },{
      where: { email: req.body.email}
    })
    let token = generateJwtToken(findUser.id);
    return res.status(200).send({
      success: true,
      status: 200,
      message: "Logged in successfully",
      data: {
        token: token,
        userDetails: userDetail
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

    return res.status(400).send({
      // message: "User not active, please verify the OTP.",
      message: "User not active",
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
}

exports.socialLogin = async (req, res) => {
  const v = new niv.Validator(req.body, {
    email: "required|email",
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
      where: { email: req.body.email },
      attributes: ["id", "email", "password", "name", "userStatus", "isDeleted"]
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

  // console.log("findUser: ", findUser);

  if (findUser && findUser.isDeleted == true) {
    return res.status(400).send({
      success: false,
      message: "User is deleted",
      error: {}
    });
  }

  if (findUser && findUser.userStatus == "A") {
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
  } else if (findUser && findUser.userStatus != "A") {
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
  }
}

exports.verifyOtp = async (req, res) => {
  const v = new niv.Validator(req.body, {
    // userId: "required",
    otp: "required",
  });
  const matched = await v.check();

  if (!matched) {
    return res.status(422).send({
      message: "must have all required field",
      error: v.errors,
      status: false,
    });
  }

  let whereClause = {};
  if (req.body.email) {
    whereClause = {
      email: req.body.email
    }
  } else {
    whereClause = {
      id: req.body.userId,
    }
  }
  let existUser;
  try {
    existUser = await models.user.findOne({
      attributes: ["id", "email", "password", "name", "otp", "otpValideTime"],
      where: whereClause
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error in finding user",
      error: error.message,
      status: false,
    });
  }
  let clientIp=req.ipInfo.ip

  if (existUser) {
    if (existUser.otp == req.body.otp && existUser.otpValideTime >= new Date()) {
      if (req.body.email) {
        try {
          await models.user.update(
            {
              userStatus: 'A',
              resetPassword: true,
              ipAddress: clientIp,
              lastloginAt: new Date()
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
        let userDetails = await models.user.findOne({
          attributes: ["id", "email", "password", "name", "otp", "otpValideTime"],
          where: {
            email: req.body.email
          },
        });
        let token = generateJwtToken(existUser.id);

        return res.status(200).send({
          status: true,
          message: "Account verified successfully",
          data: { token: token, userDetails: userDetails },
        });
      } else {
        try {
          await models.user.update(
            {
              otp: null,
              userStatus: "A",
              lastloginAt: new Date(),
              ipAddress: clientIp
            },
            { where: { id: req.body.userId } }
          );
        } catch (error) {
          return res.status(500).send({
            message: "Error in update user",
            error: error.message,
            status: false,
          });
        }

        let userDetails = await models.user.findOne({
          attributes: ["id", "email", "password", "name", "otp", "otpValideTime"],
          where: {
            id: req.body.userId,
          },
        });
        let token = generateJwtToken(existUser.id);

        return res.status(200).send({
          status: true,
          message: "Account verified successfully",
          data: { token: token, userDetails: userDetails },
        });
      }
    } else if (existUser.otp == req.body.otp && existUser.otpValideTime < new Date()) {
      try {
        await models.user.update(
          {
            otp: null,
          },
          { where: whereClause }
        );
      } catch (error) {
        return res.status(500).send({
          message: "Error in updating user",
          error: error.message,
          status: false,
        });
      }
      return res.status(400).send({
        status: false,
        message: "OTP has expired",
      });
    } else if (existUser.otp != req.body.otp) {
      return res.status(400).send({
        status: false,
        message: "OTP is not matched",
      });
    } else if (existUser && existUser.is2fa == true) {
      if (req.body.email) {
        try {
          await models.user.update(
            {
              userStatus: 'A',
              lastloginAt: new Date()
            },
            {
              where: {
                email: req.body.email
              }
            }
          );
        } catch (error) {
          return res.status(500).send({
            message: "Error in update user",
            error: error.message,
            status: false,
          });
        }
        let userDetails = await models.user.findOne({
          attributes: ["id", "email", "is2fa", "name", "otp", "otpValideTime"],
          where: {
            email: req.body.email
          },
        });
        let token = generateJwtToken(existUser.id);

        return res.status(200).send({
          status: true,
          message: "Account verified successfully",
          data: { token: token, userDetails: userDetails },
        });
      } else {
        try {
          await models.user.update(
            {
              userStatus: 'A',
              lastloginAt: new Date(),
              ipAddress: clientIp
            },
            {
              where: {
                id: req.body.userId
              }
            }
          );
        } catch (error) {
          return res.status(500).send({
            message: "Error in update user",
            error: error.message,
            status: false,
          });
        }
        let userDetails = await models.user.findOne({
          attributes: ["id", "email", "is2fa", "name", "otp", "otpValideTime"],
          where: {
            id: req.body.userId
          },
        });
        let token = generateJwtToken(existUser.id);

        return res.status(200).send({
          status: true,
          message: "Account verified successfully",
          data: { token: token, userDetails: userDetails },
        });
      }
    }

  } else {
    return res.status(400).send({
      status: false,
      message: "User not found",
    });
  }
};

exports.verifyOtp2 = async (req, res) => {
  console.log("Payload:", req.body);

  const v = new niv.Validator(req.body, {
    otp: "required",
  });
  const matched = await v.check();

  if (!matched) {
    return res.status(422).send({
      message: "Must have all required fields",
      error: v.errors,
      status: false,
    });
  }

  let whereClause = req.body.email ? { email: req.body.email } : { id: req.body.userId };
  console.log("Where Clause:", whereClause);

  let existUser;
  try {
    existUser = await models.user.findOne({
      attributes: ["id", "email", "otp", "otpValideTime", "is2fa"],
      where: whereClause,
    });
    console.log("Exist User:", existUser);
  } catch (error) {
    return res.status(500).send({
      message: "Error finding user",
      error: error.message,
      status: false,
    });
  }

  if (!existUser) {
    return res.status(400).send({
      status: false,
      message: "User not found",
    });
  }

  let clientIp=req.ipInfo.ip
  // OTP Validation
  const isOtpValid = existUser.otp == req.body.otp && existUser.otpValideTime >= new Date();
  if (isOtpValid && existUser.is2fa == false) {
    try {
      await models.user.update(
      { userStatus: "A", resetPassword: true, lastloginAt: new Date(), ipAddress: clientIp },
        { where: whereClause }
      );
      console.log("User status updated successfully");
    } catch (error) {
      return res.status(500).send({
        message: "Error updating user",
        error: error.message,
        status: false,
      });
    }

    const userDetails = await models.user.findOne({ where: whereClause });
    const token = generateJwtToken(existUser.id);

    return res.status(200).send({
      status: true,
      message: "Account verified successfully",
      data: { token, userDetails },
    });
  } else if (existUser.otp == req.body.otp && existUser.otpValideTime < new Date()) {
    return res.status(400).send({
      status: false,
      message: "OTP has expired",
    });
  } else {
    return res.status(400).send({
      status: false,
      message: "OTP verification failed",
    });
  }
};

exports.resendOtp = async (req, res) => {
  const v = new niv.Validator(req.body, {
    email: "required|email",
  });
  const matched = await v.check();

  if (!matched) {
    return res.status(422).send({
      message: "must have all required field",
      data: v.errors,
      status: false,
    });
  }

  let existUser;
  try {
    existUser = await models.user.findOne({
      where: {
        email: req.body.email,
      },
    });
  } catch (error) {
    return res.status(500).send({
      error: error.message,
      status: false,
      message: "User not found",
    });
  }
  if (existUser) {
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
        message: "Error in update otp",
        error: error.message,
        status: false,
      });
    }
    //sent mail with otp here
    const mail = {
      to: req.body.email, //sendTo
      user: existUser.name || 'User',
      otp: otp,
    };
    registerMail(mail);

    return res.status(200).send({
      status: true,
      message: "OTP resend successfully",
    });
  } else {
    return res.status(400).send({
      status: false,
      message: "User not found",
    });
  }
};

exports.me = async (req, res, next) => {
  try {
    const userDetails = await models.user.findOne({
      attributes: ["id", "name", "email", "referralCode", "colorCode", "telegramId", "userStatus", "profileImage", "cc", "phone", "dob", "gender", "twoFactorEnable", "createdAt", "availableBalance", "walletBalance", "promo", "userOwnReferralCode", "referralCode", "is2fa"],
      where: {
        id: req.authUser.id,
      },
      include: [
        {
          required: false,
          model: models.address,
          as: "address",
          attributes: ["id", "streetAddress", "state", "country", "city", "status"],
          include:
          {
            required: false,
            model: models.country,
            as: "countryDetails",
            attributes: ["id", "name"]
          },
        },
        {
          required: false,
          model: models.balance,
          as: "balance",
          attributes: ["id", "userId", "promoMoney", "depositMoney", "availablePromo", "availableBalance"]
        }
      ]
    });

    return res.status(200).send({
      status: true,
      data: userDetails,
      message: "User details send successfully",
    });
  } catch (error) {
    return res.status(500).send({
      message: "error meapi",
      error: error.message,
      status: false,
    });
  }
};

exports.forgetPassword = async (req, res) => {
  const v = new niv.Validator(req.body, {
    email: "required|email",
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
    const criteria = {
      email: req.body.email,
      userStatus: "A",
    };
    const user = await models.user.findOne({
      where: criteria,
    });
    if (!user) {
      return res.status(400).send({
        message: "If you entered a correct email address, you should receive reset instructions shortly.",
        status: false,
      });
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    await models.user.update(
      { otp: otp, otpValideTime: new Date(new Date().getTime() + 3 * 60000) },
      { where: { id: user.id } }
    );

    const mail = {
      to: req.body.email, //sendTo
      user: user.name || 'User',
      otp: otp,
    };
    registerMail(mail);
    return res.status(200).send({
      status: true,
      message: "If you entered a correct email address, you should receive reset instructions shortly.",
    });
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      message: error.message,
      status: false,
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  const v = new niv.Validator(req.body, {
    email: "required|email",
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
    const user = await models.user.findOne({
      where: {
        email: req.body.email,
        userStatus: "A",
        resetPassword: true
      }
    });
    if (!user) {
      return res.status(400).send({
        status: false,
        message: "Incorrect verification code",
      });
    }

    let hashPassword = await bcrypt.hashSync(req.body.password, 10);
    await models.user.update(
      {
        password: hashPassword,
        resetPassword: false
      },
      { where: { id: user.id } }
    );
    let token = generateJwtToken(user.id);

    return res.status(200).send({
      status: true,
      message: "Password updated successfully",
      data: { token: token, userDetails: user }
    });
  } catch (error) {
    return res.status(500).send({
      message: "error occured",
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
      // return res.status(400).send({
      //   status: false,
      //   message: "Old password is same as new password",
      //   data: {
      //     status: false,
      //     message: "Old password is same as new password",
      //   }
      // });
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

exports.updateProfile = async (req, res, next) => {
  try {
    let userDetail = await models.user.findOne({
      where: {
        id: req.authUser.id
      },
      attributes: ["id", "name"]
    })

    let nameExist = await models.user.findOne({
      where: { name: req.body.name },
      attributes: ["id", "name"]
    });

    if (nameExist && userDetail.name != req.body.name) {
      return res.status(400).send({
        success: false,
        message: "User name must be unique",
        data: nameExist,
        // data1: userDetail
      });
    }

    await models.user.update(
      {
        profileImage: req.body.profileImage,
        telegramId: req.body.telegramId,
        cc: req.body.cc,
        phone: req.body.phone,
        dob: new Date(req.body.dob),
        gender: req.body.gender,
        twoFactorEnable: req.body.twoFactorEnable,
        name: req.body.name,
        is2fa: req.body.is2fa
      },
      { where: { id: req.authUser.id } }
    );
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in profile update",
      error: e.message
    });
  }
  let findAddress
  try {
    findAddress = await models.address.findOne({
      where: { userId: req.authUser.id }
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in finding address",
      error: e.message
    });
  }

  if (findAddress) {
    findAddress.streetAddress = req.body.streetAddress,
      findAddress.state = req.body.state;
    findAddress.country = req.body.country;
    findAddress.city = req.body.city;
    try {
      await findAddress.save()
    } catch (e) {
      return res.status(500).send({
        success: false,
        message: "Error in save address",
        error: e.message
      })
    }
  } else {
    try {
      await models.address.create({
        streetAddress: req.body.streetAddress,
        state: req.body.state,
        country: req.body.country,
        city: req.body.city,
        userId: req.authUser.id
      })
    } catch (e) {
      return res.status(500).send({
        success: false,
        message: "Error in save address",
        error: e.message
      })
    }
  }
  return res.status(200).send({
    success: true,
    message: "Profile updated successfully",
  });

}

// as design
exports.sendOtpRegister = async (req, res, next) => {
  const v = new niv.Validator(req.body, {
    email: "required|email",
  });
  const matched = await v.check();

  if (!matched) {
    return res.status(422).send({
      message: "must have all required field",
      error: v.errors,
      status: false,
    });
  }

  let userDetails
  try {
    userDetails = await models.user.findOne({
      attributes: ["id", "email", "userStatus"],
      where: {
        email: req.body.email,
      },
    });
  } catch (e) {
    return res.status(500).send({
      message: "error in find user",
      error: error.message,
      status: false,
    });
  }

  if (userDetails) {
    if (userDetails.userStatus == "A" || userDetails.userStatus == "D") {
      return res.status(400).send({
        success: false,
        message: "User already exist with same email",
        error: req.body.email,
      });
    } else {
      let otp = Math.floor(1000 + Math.random() * 9000);
      let otpValideTime = new Date(new Date().getTime() + 3 * 60000);

      userDetails.otp = otp;
      userDetails.otpValideTime = otpValideTime;
      await userDetails.save();

      const mail = {
        to: req.body.email,
        otp: otp,
        user: userDetails.name || 'User'
      };
      registerMail(mail);

      return res.status(200).send({
        success: true,
        message: "Otp sent successfully",
        data: userDetails
      });
    }
  }

  let otp = Math.floor(1000 + Math.random() * 9000);
  let otpValideTime = new Date(new Date().getTime() + 3 * 60000);

  let createUser;
  try {
    createUser = await models.user.create({
      email: req.body.email,
      otp: otp,
      otpValideTime: otpValideTime
    })

    const mail = {
      to: req.body.email,
      otp: otp,
      user: 'User'
    };
    registerMail(mail);

    return res.status(200).send({
      status: true,
      data: createUser,
      message: "Otp sent successfully",
    });
  } catch (error) {
    return res.status(500).send({
      message: "error create user",
      error: error.message,
      status: false,
    });
  }

}

// as design
// exports.register = async (req, res) => {
//   const v = new niv.Validator(req.body, {
//     name: "required|string",
//     email: "required|email",
//     password: "required|string",
//     otp: "required",
//     telegramId: "string",
//     referCode: "string"
//   });
//   const matched = await v.check();

//   if (!matched) {
//     return res.status(200).send({
//       success: false,
//       data: v.errors,
//       message: "must have all required field",
//       status: 422,
//     });
//   }

//   req.body.email = req.body.email.toLowerCase();

//   let findUserByEmail;
//   try {
//     findUserByEmail = await models.user.findOne({
//       where: { email: req.body.email, otp: req.body.otp, userStatus: "A" },
//       attributes: ["id", "email", "name", "otp", "otpValideTime", "userStatus"]
//     })
//   } catch (error) {
//     return res.status(500).send({
//       success: false,
//       message: "error, in finding user by email",
//       error: error.message
//     });
//   }

//   if (findUserByEmail) {
//     if (findUserByEmail.userStatus == "I" || findUserByEmail.userStatus == "D") {
//       return res.status(400).send({
//         success: false,
//         message: "Account not verified",
//       });
//     } else {
//       let colorCodes;
//     try {
//       colorCodes = await models.colorCode.findAll({})
//     } catch (e) {
//       return res.status(500).send({
//         message: "Error in finding color code",
//         error: e.message,
//         status: false
//       });
//     }

//     let randomColorCode = colorCodes[Math.floor(1 + Math.random() * colorCodes.length)]

//       findUserByEmail.name = req.body.name;
//       findUserByEmail.email = req.body.email;
//       findUserByEmail.telegramId = req.body.telegramId;
//       findUserByEmail.referralCode = req.body.referralCode;
//       findUserByEmail.colorCode = randomColorCode ? randomColorCode.code : "#FF335E" ;
//       findUserByEmail.otp = null;
//       findUserByEmail.password = await bcrypt.hashSync(req.body.password, 10);
//       await findUserByEmail.save();

//       return res.status(200).send({
//         success: true,
//         message: "User has registered successfully",
//         data: findUserByEmail
//       });
//     }
//   }else{
//     return res.status(400).send({
//       success: false,
//       message: "Account not verified",
//     });
//   }
// }

exports.listOfInSeasonSports = async (req, res, next) => {
  try {

  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in listOfInSeasonSports",
      error: e.message
    });
  }
}

exports.generateReferalCode = async (req, res, next) => {
  try {
    let randomCode = randomstring.generate({
      length: 8,
      charset: 'alphabetic'
    });

    return res.status(200).send({
      success: true,
      message: "Code generated successfully",
      data: randomCode
    });

  } catch (error) {
    return res.status(500).send({
      message: "error in generateReferalCode",
      error: error.message,
      success: false,
    });
  }
}

// not in use
exports.inviteUser_2 = async (req, res, next) => {
  const v = new niv.Validator(req.body, {
    email: "required|email",
    code: "required|string",
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

  try {
    // let randomCode = randomstring.generate({
    //   length: 8,
    //   charset: 'alphabetic'
    // });
    let existCode = await models.userInvite.findAll({
      where: {
        code: req.body.code,
      }
    });
    if (existCode && existCode.length > 0) {
      return res.status(400).send({
        success: false,
        message: "code is already used",
        data: []
      });
    }

    let inviteUser = await models.userInvite.create({
      userId: req.authUser.id,
      email: req.body.email,
      code: req.body.code,
      status: "A"
    });

    const mail = {
      to: req.body.email,
      code: req.body.code,
      user: req?.body?.name || 'User'
    };
    sendInviteMail(mail);

    return res.status(200).send({
      success: true,
      message: "Invite sent successfully",
      data: inviteUser
    });

  } catch (error) {
    return res.status(500).send({
      message: "error invite user",
      error: error.message,
      success: false,
    });
  }
}

exports.inviteUser = async (req, res, next) => {
  const v = new niv.Validator(req.body, {
    email: "required|email",
    code: "required|string",
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

  try {
    // let randomCode = randomstring.generate({
    //   length: 8,
    //   charset: 'alphabetic'
    // });
    // let existCode = await models.userInvite.findAll({
    //   where: {
    //     code: req.body.code,
    //   }
    // });
    // if (existCode && existCode.length > 0) {
    //   return res.status(400).send({
    //     success: false,
    //     message: "code is already used",
    //     data: []
    //   });
    // }

    let inviteUser = await models.userInviteByCode.create({
      userId: req.authUser.id,
      email: req.body.email,
      code: req.authUser.userOwnReferralCode,
      status: "A"
    });

    const mail = {
      to: req.body.email,
      code: req.authUser.userOwnReferralCode,
      user: req?.body?.name || 'User'
    };
    sendInviteMail(mail);

    return res.status(200).send({
      success: true,
      message: "Invite sent successfully",
      data: inviteUser
    });

  } catch (error) {
    return res.status(500).send({
      message: "error invite user",
      error: error.message,
      success: false,
    });
  }
}

exports.getAllinvitedUser = async (req, res, next) => {
  try {
    const perPage = +req?.query?.limit || 100;
    const page = +req?.query?.page || 1;
    const offset = (perPage * page) - perPage;

    const { count, rows } = await userInvite.findAndCountAll({
      where: { isDeleted: false },
      limit: perPage,
      offset,
      order: [["createdAt", "DESC"]],
    });

    if (!rows.length) {
      return res.status(404).send({
        message: "No invited users found",
        success: false,
        data: [],
      });
    }

    return res.status(200).send({
      message: "Invited users fetched successfully",
      success: true,
      data: rows,
      pagination: {
        total: count,
        perPage,
        currentPage: page,
        totalPages: Math.ceil(count / perPage),
      },
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error fetching invited users",
      error: error.message,
      success: false,
    });
  }
};

exports.uploadPlayerImage = async (req, res) => {
  let findPlayers = await models.playerList.findAll({
    where: {
      sportsId: "sr:sport:117",
      profileImage: null
      // profileImage: {[Op.eq]: ""}
    }
  })

  console.log(findPlayers.length)
  // return false

  for (let i = 0; i < findPlayers.length; i++) {
    let playerName = findPlayers[i].playerName + ".png";
    // console.log(playerName)
    const folderPath = './images'; // Replace with your folder path
    console.log(playerName)
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        return console.error(`Unable to scan directory: ${err}`);
      }
      files.forEach(file => {
        console.log(file)
        if (playerName == file) {
          const filePath = path.join(folderPath, file);
          const fileContent = fs.readFileSync(filePath);

          // Upload to S3
          const params = {
            Bucket: process.env.AWS_s3_BUCKET,
            Key: "public/player_image/"+file+Date.now()+".png", // Filename on S3
            Body: fileContent,
            ContentType: 'image/jpeg' // Adjust based on the file type
          };

          s3.upload(params, (err, data) => {
            if (err) {
              return console.error("Error uploading to S3:", err);
            }
            console.log(`File successfully uploaded to S3 at ${data}`);
            models.playerList.update({
              profileImage: data.Key
            },{
              where:{
                id: findPlayers[i].id
              }
            })
          });

        
        }
      });
    });
  }

}