"use strict";
const express = require("express");
const { jwtVerify } = require("../function/common");
const api = express.Router();
const auth_api_router = express.Router();
const auth_admin_router = express.Router();
const models = require("../models");

auth_api_router.use(async (req, res, next) => {
  if (req.headers.authorization) {
    let decode;
    try {
      req.headers.authorization = req.headers.authorization.split(" ")[1];
      decode = await jwtVerify(req.headers.authorization);
    } catch (e) {
      return res.status(401).send({
        status: false,
        error: "token not verfied",
      });
    }
    const user = await models.user.findOne({
      where: { id: decode.data },
    });

    if (!user) {
      return res.status(401).send({
        status: false,
        errors: "Invalid user or token",
      });
    } else {
      // if (user.userType != "A") {
      //   req.authUser = user.dataValues;
      //   next();
      // } else {
      //   return res.status(403).send({
      //     status: false,
      //     errors: "user is an admin",
      //   });
      // }
      req.authUser = user.dataValues;
      next();
    }
  } else {
    return res.status(401).send({
      status: false,
      error: "Missing authorization token",
    });
  }
});

auth_admin_router.use(async (req, res, next) => {
  if (req.headers.authorization) {
    let decode;
    try {
      req.headers.authorization = req.headers.authorization.split(" ")[1];
      decode = await jwtVerify(req.headers.authorization);
    } catch (e) {
      return res.status(401).send({
        status: false,
        error: "token not verfied",
      });
    }
    const user = await models.user.findOne({
      where: { id: decode.data },
    });

    if (!user) {
      return res.status(401).send({
        status: false,
        errors: "Invalid user or token",
      });
    } else {
      if (user.userType == "ADMIN") {
        req.authUser = user.dataValues;
        next();
      } else {
        return res.status(403).send({
          status: false,
          errors: "user is not an admin",
        });
      }
    }
  } else {
    return res.status(401).send({
      status: false,
      error: "Missing authorization token",
    });
  }
});

module.exports = function (app) {
  const userCont = require("../controller/userController");
  const s3Cont = require("../function/s3ImageUpload");
  const listCont = require("../controller/list");
  const adminCont = require("../controller/adminController");
  const sportradarCont = require("../controller/sportradarController");
  const bettingCont = require("../controller/bettingController");
  const settingCont = require("../controller/settingController");
  const paymentCont = require("../controller/paymentController");
  const resourceCont = require("../controller/resourceController");
  const sportraderResultCont = require("../controller/sportraderResultController");

  app.use("/api", api);
  api.post("/register/otp", userCont.sendOtpRegister);
  api.post("/register", userCont.register);
  api.post("/login", userCont.login);
  api.post("/social-login", userCont.socialLogin);
  api.get("/me", auth_api_router, userCont.me);
  api.put("/change/password", auth_api_router, userCont.changePassword);
  api.post("/verify-otp", userCont.verifyOtp);
  api.post("/resend-otp", userCont.resendOtp);
  api.post("/forget-password", userCont.forgetPassword);
  api.post("/reset-password", userCont.resetPassword);
  api.put("/user/profile", auth_api_router, userCont.updateProfile);

  api.post("/player-image", userCont.uploadPlayerImage);

  api.put("/presigned-upload", s3Cont.presignedUrlUpload);
  api.get("/country/list", listCont.countryList);

  // from db
  api.get("/sports/list", sportradarCont.sportsList);
  api.get("/competition/list/:sportsId", sportradarCont.competitionList);
  api.get("/game/list/:competitionId", sportradarCont.gameList);
  api.get("/player/list/:sportsId", sportradarCont.playerList);

  api.get("/match/list/:sportId", sportradarCont.matchList);

  api.get("/player/list", sportradarCont.playerListBySportId);
  api.get("/sport/market/list/:sportsId", sportradarCont.marketList);

  // from sporttrader
  api.get("/sportrader/sports/list", sportradarCont.sportraderSportsList);
  api.get("/sportrader/competition/list/:id", sportradarCont.sportraderCompetitionList);
  api.get("/sportrader/game/list/:id", sportradarCont.sportraderGameList);
  api.get("/sportrader/player/list/:gameId", sportradarCont.sportraderPlayerList);
  api.get("/sportrader/all-game/list/:sportsId", sportradarCont.sportraderAllListFrom);
  api.get("/sportrader/all-player/list/:competitionId", sportradarCont.sportraderPlayerCompetitionId);

  api.get("/sportrader/all-player/mma", sportradarCont.playerListMMA);


  api.get("/sportrader/findResult/nba", sportraderResultCont.findResult);
  api.get("/sportrader/findResult/nhl", sportraderResultCont.findResultNHL);


  // betting
  api.post("/betting/create", auth_api_router, bettingCont.createBetting);
  api.put("/betting/edit/:betId", auth_api_router, bettingCont.editBetting);
  api.delete("/betting/delete/:betId", auth_api_router, bettingCont.deleteBetting);
  api.get("/betting/list", auth_api_router, bettingCont.bettingList);
  api.get("/betting/details/:betId", auth_api_router, bettingCont.bettingDetails);

  api.get("/betting/result", bettingCont.bettingResult);

  //payment
  api.post("/create/invoice", auth_api_router, paymentCont.createInvoice);
  api.post("/payment/webhook", paymentCont.paymentWebhook);

  api.get("/nowpayment/currency/list", paymentCont.currencyList);
  api.post("/deposit/initiate", auth_api_router, paymentCont.depositInitiate);
  api.get("/deposit/payment/status", paymentCont.paymentStatus);
  api.post("/payment/webhook2", paymentCont.paymentWebhook2);

  // withdrawal
  api.post("/withdraw/initiate", auth_api_router, paymentCont.withdrawInitiate);
  api.post("/payment/webhook3", paymentCont.paymentWebhook3);

  api.post("/invoice/check/conversion", paymentCont.invoiceToCheckConversion);
  api.get("/conversion/amount", paymentCont.haveConversionData);

  api.post("/withdraw/request-send", auth_api_router, paymentCont.sendWithdrawRequest);


  api.get("/user/payment/get-all", auth_api_router, paymentCont.paymentListUser);
  api.get("/admin/payment/get-all", auth_admin_router, paymentCont.paymentListAdmin);

  // promo
  api.get("/user/promo/get-all", auth_api_router, paymentCont.getAllPromoUser);

  // invite user
  api.post("/user/invite/generate-code", auth_api_router, userCont.generateReferalCode);
  api.post("/user/invite/add", auth_api_router, userCont.inviteUser);
  api.get("/user/invite/get-all", auth_api_router, userCont.getAllinvitedUser);



  /* --------------------------------------------------------- ADMIN ROUTES -------------------------------------------------- */

  api.post("/admin/login", adminCont.login);
  api.get("/admin/me", auth_admin_router, adminCont.me);
  api.patch("/admin/change-password", auth_admin_router, adminCont.changePassword);

  api.get("/admin/user/get-all", auth_admin_router, adminCont.getAllUser);
  api.get("/admin/user/get-one/:id", auth_admin_router, adminCont.getOneUser);
  api.patch("/admin/user/update/:id", auth_admin_router, adminCont.updateOneUser);
  api.delete("/admin/user/delete/:id", auth_admin_router, adminCont.deleteOneUser);

  api.patch("/admin/sports/status/:id", auth_admin_router, adminCont.sportsStatusChange);
  api.patch("/admin/game/status/:id", auth_admin_router, adminCont.gameStatusChange);
  api.get("/admin/game/list/:sportsId", auth_admin_router, adminCont.gameList);

  api.patch("/admin/api-token/update", auth_admin_router, adminCont.tokenController);
  api.get("/admin/api-token/get", auth_admin_router, adminCont.tokenFetch);

  // sports from db
  api.get("/admin/sports/get-all", adminCont.getAllSports);
  api.get("/admin/sports/get-one/:id", sportradarCont.getOneSports);
  api.patch("/admin/sports/update/:id", auth_admin_router, sportradarCont.updateOneSports);
  api.delete("/admin/sports/delete/:id", auth_admin_router, sportradarCont.deleteOneSports);

  // player list from db
  api.get("/admin/player-list/get-all", adminCont.getAllPlayerList);
  api.get("/admin/player-list/get-one/:id", adminCont.getOnePlayerList);
  api.patch("/admin/player-list/update/:id", auth_admin_router, adminCont.updateOnePlayerList);

  // players from db
  api.get("/admin/players/get-all/:sportsId", adminCont.getAllPlayers);

  // play setting
  api.post("/admin/setting/create", auth_admin_router, settingCont.createSetting);
  api.patch("/admin/setting/update/:id", auth_admin_router, settingCont.updateSettings);
  api.delete("/admin/setting/delete/:id", auth_admin_router, settingCont.deleteSettings);

  api.get("/admin/setting/get-all", settingCont.getAllSetting);
  api.get("/admin/setting/get-one/:id", settingCont.getOneSetting);
  api.post("/admin/setting/get-one/entry", settingCont.findSettingsForEntry);
  // api.patch("/admin/setting/update/:id", auth_admin_router, settingCont.updateSetting);

  // promo  admin
  api.post("/admin/promo/add", auth_admin_router, paymentCont.addPromo);
  api.get("/admin/promo/get-all", auth_admin_router, paymentCont.getAllPromo)

  api.post("/admin/adjust-balance/:userId", auth_admin_router, adminCont.updateUserBalance)
  api.post("/admin/fund/add", auth_admin_router, paymentCont.addFund)

  // terms
  api.get("/terms/get", resourceCont.getTerms)
  api.put("/admin/terms/update", auth_admin_router, resourceCont.updateTerms)

  // privacy
  api.get("/privacy-policy/get", resourceCont.getPrivacy)
  api.put("/admin/privacy-policy/update", auth_admin_router, resourceCont.updatePrivacy)


  // help
  api.get("/help/get", resourceCont.getHelp)
  api.put("/admin/help/update", auth_admin_router, resourceCont.updateHelp)

  // FAQ
  api.post("/admin/faq/create", auth_admin_router, resourceCont.createFaq);
  api.get("/faq/get-all", resourceCont.getAllFaq);
  api.get("/faq/get-one/:faqId", resourceCont.getOneFaq);
  api.patch("/admin/faq/update/:faqId", auth_admin_router, resourceCont.updateFaq);
  api.delete("/admin/faq/delete/:faqId", auth_admin_router, resourceCont.deleteFaq);

  // market
  api.get("/admin/market/list/:sportsId", adminCont.marketList);
  api.get("/admin/market/get-one/:marketId", adminCont.marketGetOne);
  api.put("/admin/market/update/:marketId", auth_admin_router, adminCont.updateMarketName);
  api.put("/admin/market/update-status/:marketId", auth_admin_router, adminCont.updateMarketStatus);

  //bet
  api.get("/admin/betting/list/:userId", auth_admin_router, adminCont.bettingList);
  api.get("/admin/betting/details/:betId", auth_admin_router, adminCont.bettingDetails);

  api.get("/admin/withdraw-request/list", auth_admin_router, adminCont.withdrawRequestList);

  // stat
  api.get("/admin/get-stat", auth_admin_router, adminCont.dailyUpdate);
}