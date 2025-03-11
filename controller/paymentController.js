const axios = require('axios');
const randomstring = require("randomstring");
const niv = require("node-input-validator");
const models = require("../models");
const sequelize = require("sequelize");
const Op = sequelize.Op;

//live
let baseUrlPayment = "https://api.nowpayments.io/v1/"
let invoiceDetailsUrl = "https://account-api.nowpayments.io/"
let conversionUrl = "https://account-api.nowpayments.io/merchant-estimate-price"
let nowpayEmail = "payments@draft.fun";
let nowpayPassword = "Pat007!!!"
let tid="ab509d4c-9ed9-4973-9d2e-398bd851fc89"

let backendBaseUrl="https://api.draft.fun/api/"

// let backendBaseUrl="http://34.192.80.235/api/"
//dev
// let baseUrlPayment = "https://api-sandbox.nowpayments.io/v1/"
// let invoiceDetailsUrl = "https://account-api-sandbox.nowpayments.io/"
// let conversionUrl = "https://account-api-sandbox.nowpayments.io/merchant-estimate-price"
// let nowpayEmail="arunava@technoexponent.com";
// let nowpayPassword="12345678"

let promoForInvite = 15

exports.createInvoice = async (req, res) => {
  const v = new niv.Validator(req.body, {
    amount: "required"
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

  let orderId = randomstring.generate({
    length: 8,
    charset: 'alphabetic'
  });
  let data = JSON.stringify({
    "price_amount": req.body.amount,
    "price_currency": "usd",
    "order_id": "order_" + orderId,
    "order_description": "Add in wallet",
    "ipn_callback_url": process.env.IPN_CALLBACK_URL,
    "success_url": process.env.SUCCESS_URL,
    "cancel_url": process.env.CANCEL_URL,
    //   "partially_paid_url": "https://nowpayments.io",
    // "is_fixed_rate": true,
    // "is_fee_paid_by_user": false
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api-sandbox.nowpayments.io/v1/invoice',
    headers: {
      'x-api-key': process.env.NOWPAYMENT_API_KEY,
      'Content-Type': 'application/json'
    },
    data: data
  };

  axios.request(config)
    .then(async (response) => {
      console.log(JSON.stringify(response.data));
      await models.invoice.create({
        userId: req.authUser.id,
        priceAmount: req.body.amount,
        priceCurrency: "usd",
        orderId: "order_" + orderId,
        orderDescription: "Add in wallet",
        invoiceId: response.data.id,
        invoiceUrl: response.data.invoice_url
        // isFixedRate: true,
        // isFeePaidByUser: false
      })

      return res.status(200).json({
        success: true,
        message: "Invoice sended",
        invoiceLink: response.data.invoice_url
      });
    })

    .catch((error) => {
      console.log(error);
    });

}//not in use now
exports.paymentWebhook = async (req, res) => {
  console.log("webhook................", req.body)
  try {
    await models.invoice.update({
      paid: req.body.payment_status
    },
      {
        where: {
          invoiceId: req.body.invoice_id
        }
      })
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Error in update invoice list",
    });
  }
  if (req.body.payment_status == "finished") {
    let findInvoiceDetails;
    try {
      findInvoiceDetails = await models.invoice.findOne({
        where: {
          invoiceId: req.body.invoice_id
        }
      })
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Error in find invoice",
      });
    }
    try {
      await models.payment.create({
        userId: findInvoiceDetails.userId,
        invoiceTableId: findInvoiceDetails.id,
        actuallyPaid: req.body.actually_paid,
        fee: req.body.fee,
        invoiceId: req.body.invoice_id,
        outcomeAmount: req.body.outcome_amount,
        outcomeCurrency: req.body.outcome_currency,
        payAddress: req.body.pay_address,
        payAmount: req.body.pay_amount,
        payCurrency: req.body.pay_currency,
        paymentId: req.body.payment_id,
        paymentStatus: req.body.payment_status,
        priceAmount: req.body.price_amount,
        priceCurrency: req.body.price_currency,
        purchaseId: req.body.purchase_id,
        paidAt: req.body.updated_at,
      })
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Error in create payment",
      });
    }

    try {
      let userDetails = await models.user.findOne({
        where: { id: findInvoiceDetails.userId }
      })
      let walletBalance = Number(userDetails.walletBalance) + Number(req.body.price_amount)
      let availableBalance = Number(userDetails.availableBalance) + Number(req.body.price_amount)
      await models.user.update({
        walletBalance: walletBalance,
        availableBalance: availableBalance
      }, {
        where: {
          id: findInvoiceDetails.userId
        }
      })
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Error in update balance",
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: "success",
  });
}

exports.addPromo = async (req, res) => {
  try {
    await models.payment.create({
      userId: req.body.userId,
      // invoiceTableId: findInvoiceDetails.id,
      // actuallyPaid: req.body.actually_paid,
      // fee: req.body.fee,
      // invoiceId: req.body.invoice_id,
      // outcomeAmount: req.body.outcome_amount,
      // outcomeCurrency: req.body.outcome_currency,
      // payAddress: req.body.pay_address,
      // payAmount: req.body.pay_amount,
      // payCurrency: req.body.pay_currency,
      // paymentId: req.body.payment_id,
      // paymentStatus: req.body.payment_status,
      priceAmount: req.body.priceAmount,
      // priceCurrency: req.body.price_currency,
      // purchaseId: req.body.purchase_id,
      // paidAt: req.body.updated_at,
      paymentType: "PROMO",
      paymentMode: "PROMO",
      paymentStatus: "finished",
      promoById: req.authUser.id // The user/admin who added the promo
    });

    let balanceDetails = await models.balance.findOne({
      where: { userId: req.body.userId }
    });
    // console.log("userDetails: ", userDetails);
    let promoMoney = Number(balanceDetails.promoMoney) + Number(req.body.priceAmount)
    let availablePromo = Number(balanceDetails.availablePromo) + Number(req.body.priceAmount)
    await models.balance.update({
      promoMoney: promoMoney,
      availablePromo: availablePromo,
    }, {
      where: {
        userId: req.body.userId
      }
    });

    return res.status(200).json({
      success: true,
      message: "success",
    });

  } catch (error) {
    return res.status(500).send({
      message: "error add Promo",
      error: error.message,
      success: false,
    });
  }
}

exports.addFund = async (req, res) => {
  try {
    await models.payment.create({
      userId: req.body.userId,
      priceAmount: req.body.priceAmount,
      paymentType: "FUND",
      paymentMode: "DEPOSIT",
      paymentStatus: "finished",
      promoById: req.authUser.id // The user/admin who added the promo
    });

    let balanceDetails = await models.balance.findOne({
      where: { userId: req.body.userId }
    });
    // console.log("userDetails: ", userDetails);
    let depositMoney = Number(balanceDetails.depositMoney) + Number(req.body.priceAmount)
    let availableBalance = Number(balanceDetails.availableBalance) + Number(req.body.priceAmount)
    await models.balance.update({
      depositMoney: depositMoney,
      availableBalance: availableBalance,
    }, {
      where: {
        userId: req.body.userId
      }
    });

    return res.status(200).json({
      success: true,
      message: "success",
    });

  } catch (error) {
    return res.status(500).send({
      message: "error add Promo",
      error: error.message,
      success: false,
    });
  }
}

exports.getAllPromo = async (req, res) => {
  try {
    const perPage = +req?.query?.limit || 100;
    const page = +req?.query?.page || 1;
    const offset = (perPage * page) - perPage;

    let whereClause = {
      paymentType: { [Op.in]: ["PROMO", "FUND"] }
    };

    if (req.query.userId) {
      whereClause.userId = req.query.userId;
    }

    const promos = await models.payment.findAndCountAll({
      where: whereClause,
      attributes: ["id", "userId", "priceAmount", "paymentType", "createdAt", "promoById"],
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
      message: "Promos fetched successfully",
      data: promos.rows,
      pagination: {
        totalRecords: promos.count,
        currentPage: page,
        totalPages: Math.ceil(promos.count / perPage),
        perPage: perPage,
      },
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error fetching promos",
      error: error.message,
      success: false,
    });
  }
};

exports.getAllPromoUser = async (req, res) => {
  try {
    const perPage = +req?.query?.limit || 100;
    const page = +req?.query?.page || 1;
    const offset = (perPage * page) - perPage;

    const promos = await models.payment.findAndCountAll({
      where: { paymentType: { [Op.in]: ["PROMO", "FUND"] }, userId: req.authUser.id },
      attributes: ["id", "userId", "priceAmount", "paymentType", "createdAt", "promoById"],
      offset: offset,
      limit: perPage,
      order: [["createdAt", "DESC"]], // Sort by most recent promos
    });

    return res.status(200).json({
      success: true,
      message: "Promos fetched successfully",
      data: promos.rows,
      pagination: {
        totalRecords: promos.count,
        currentPage: page,
        totalPages: Math.ceil(promos.count / perPage),
        perPage: perPage,
      },
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error fetching promos",
      error: error.message,
      success: false,
    });
  }
};

exports.paymentListUser = async (req, res) => {
  try {
    const perPage = +req?.query?.limit || 100;
    const page = +req?.query?.page || 1;
    const offset = (perPage * page) - perPage;

    const whereClause = {
      userId: req.authUser.id,
      [Op.or]: [
        { paymentStatus: "finished" },
        { paymentStatus: null },
        { paymentStatus: "" },
        { paymentStatus: "partially_paid" },
      ]
    };

    // if (req.query.paymentType) {
    //   whereClause.paymentType = req.query.paymentType;
    // }

    if (req.query.paymentMode) {
      whereClause.paymentMode = req.query.paymentMode; // DEPOSIT, WITHDRAW
      // whereClause.paymentType = "ADDON"
    }

    // Add filters for startDate and endDate
    if (req.query.startDate || req.query.endDate) {
      whereClause.createdAt = {};

      if (req.query.startDate) {
        whereClause.createdAt[Op.gte] = new Date(req.query.startDate); // Greater than or equal to startDate
      }

      if (req.query.endDate) {
        whereClause.createdAt[Op.lte] = new Date(req.query.endDate); // Less than or equal to endDate
      }
    }

    const promos = await models.payment.findAndCountAll({
      where: whereClause,
      // attributes: ["id", "userId", "priceAmount", "paymentType", "createdAt", "promoById"],
      offset: offset,
      limit: perPage,
      order: [["createdAt", "DESC"]], // Sort by most recent promos
    });

    return res.status(200).json({
      success: true,
      message: "Payment list fetched successfully",
      data: promos.rows,
      pagination: {
        totalRecords: promos.count,
        currentPage: page,
        totalPages: Math.ceil(promos.count / perPage),
        perPage: perPage,
      },
    });
  } catch (error) {
    console.log("error: ", error);
    return res.status(500).send({
      message: "Error fetching promos",
      error: error.message,
      success: false,
    });
  }
};

exports.paymentListAdmin = async (req, res) => {
  try {
    const perPage = +req?.query?.limit || 100;
    const page = +req?.query?.page || 1;
    const offset = (perPage * page) - perPage;

    let whereClause = {
      paymentType: {
        [Op.or]: ["ADDON", "PROMO"]
      },
      paymentStatus: { [Op.or]: ["", "finished", "partially_paid"] }
    }
    if (req.query.deposit) {
      whereClause = {
        paymentType: {
          [Op.or]: ["ADDON"]
        },
        paymentStatus: { [Op.or]: ["finished", "partially_paid"] }
      }
    }

    const promos = await models.payment.findAndCountAll({
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
      message: "Payment fetched successfully",
      data: promos.rows,
      pagination: {
        totalRecords: promos.count,
        currentPage: page,
        totalPages: Math.ceil(promos.count / perPage),
        perPage: perPage,
      },
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error fetching promos",
      error: error.message,
      success: false,
    });
  }
};

exports.currencyList = async (req, res) => {
  // try {
  //   let config = {
  //     method: 'get',
  //     maxBodyLength: Infinity,
  //     url: baseUrlPayment + "full-currencies",
  //     headers: {
  //       'x-api-key': process.env.NOWPAYMENT_API_KEY
  //     }
  //   };
  //   axios.request(config)
  //     .then((response) => {
  //       // console.log(JSON.stringify(response.data));
  //       return res.status(200).json({
  //         success: true,
  //         message: "Currency list",
  //         data: response.data
  //       });
  //     })
  //     .catch((error) => {
  //       return res.status(500).json({
  //         success: false,
  //         message: "Error in Currency list",
  //         error: error.message
  //       });
  //     });
  // } catch (e) {
  //   return res.status(500).json({
  //     success: false,
  //     message: "Error in Currency list",
  //     error: e.message
  //   });
  // }

  // let list = {"currencies":[
  //   {
  //     "id": 59,
  //     "code": "DAI",
  //     "name": "DAI",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 10,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/dai.svg",
  //     "track": true,
  //     "cg_id": "dai",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": "0x6b175474e89094c44da98b954eedeac495271d0f",
  //     "network_precision": "18",
  //     "explorer_link_hash": "https://eth-explorer.nownodes.io/tx/:hash",
  //     "precision": 8,
  //     "ticker": "dai",
  //     "is_defi": false,
  //     "is_popular": true,
  //     "is_stable": true,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 40,
  //     "code": "USDC",
  //     "name": "USD Coin (Ethereum)",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 41,
  //     "extra_id_exists": false,
  //     "extra_id_regex": "",
  //     "logo_url": "/images/coins/usdc.svg",
  //     "track": true,
  //     "cg_id": "usd-coin",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  //     "network_precision": "6",
  //     "explorer_link_hash": "https://eth-explorer.nownodes.io/tx/:hash",
  //     "precision": 6,
  //     "ticker": "usdc",
  //     "is_defi": false,
  //     "is_popular": true,
  //     "is_stable": true,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 52,
  //     "code": "USDTTRC20",
  //     "name": "Tether USD (Tron)",
  //     "enable": true,
  //     "wallet_regex": "^T[1-9A-HJ-NP-Za-km-z]{33}$",
  //     "priority": 10,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/usdttrc20.svg",
  //     "track": true,
  //     "cg_id": "tether",
  //     "is_maxlimit": false,
  //     "network": "trx",
  //     "smart_contract": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  //     "network_precision": "6",
  //     "explorer_link_hash": "https://tronscan.org/#/transaction/:hash",
  //     "precision": 6,
  //     "ticker": "usdt",
  //     "is_defi": false,
  //     "is_popular": true,
  //     "is_stable": true,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 30,
  //     "code": "USDTERC20",
  //     "name": "Tether USD (Ethereum)",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 29,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/usdterc20.svg",
  //     "track": true,
  //     "cg_id": "tether",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  //     "network_precision": "6",
  //     "explorer_link_hash": "https://eth-explorer.nownodes.io/tx/:hash",
  //     "precision": 6,
  //     "ticker": "usdt",
  //     "is_defi": false,
  //     "is_popular": true,
  //     "is_stable": true,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 1,
  //     "code": "BTC",
  //     "name": "Bitcoin",
  //     "enable": true,
  //     "wallet_regex": "^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^(bc1|BC1)[0-9A-Za-z]{39,59}$",
  //     "priority": 0,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/btc.svg",
  //     "track": true,
  //     "cg_id": "bitcoin",
  //     "is_maxlimit": false,
  //     "network": "btc",
  //     "smart_contract": null,
  //     "network_precision": "8",
  //     "explorer_link_hash": "https://btc-explorer.nownodes.io/tx/:hash",
  //     "precision": 8,
  //     "ticker": "btc",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": "c0",
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 15,
  //     "code": "ETH",
  //     "name": "Ethereum",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 1,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/eth.svg",
  //     "track": true,
  //     "cg_id": "ethereum",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": null,
  //     "network_precision": "18",
  //     "explorer_link_hash": "https://eth-explorer.nownodes.io/tx/:hash",
  //     "precision": 8,
  //     "ticker": "eth",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": "c60_t",
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 2,
  //     "code": "LTC",
  //     "name": "Litecoin",
  //     "enable": true,
  //     "wallet_regex": "^(L|M|3)[A-Za-z0-9]{33}$|^(ltc1)[0-9A-Za-z]{39}$",
  //     "priority": 2,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/ltc.svg",
  //     "track": true,
  //     "cg_id": "litecoin",
  //     "is_maxlimit": false,
  //     "network": "ltc",
  //     "smart_contract": null,
  //     "network_precision": "8",
  //     "explorer_link_hash": "https://ltc-explorer.nownodes.io/tx/:hash",
  //     "precision": 8,
  //     "ticker": "ltc",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 6,
  //     "code": "TRX",
  //     "name": "Tron",
  //     "enable": true,
  //     "wallet_regex": "^T[1-9A-HJ-NP-Za-km-z]{33}$",
  //     "priority": 6,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/trx.svg",
  //     "track": true,
  //     "cg_id": "tron",
  //     "is_maxlimit": false,
  //     "network": "trx",
  //     "smart_contract": null,
  //     "network_precision": "6",
  //     "explorer_link_hash": "https://tronscan.org/#/transaction/:hash",
  //     "precision": 6,
  //     "ticker": "trx",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 86,
  //     "code": "SHIB",
  //     "name": "Shiba Inu",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 10,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/shib.svg",
  //     "track": true,
  //     "cg_id": "shiba-inu",
  //     "is_maxlimit": true,
  //     "network": "eth",
  //     "smart_contract": "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
  //     "network_precision": "18",
  //     "explorer_link_hash": "https://eth-explorer.nownodes.io/tx/:hash",
  //     "precision": 8,
  //     "ticker": "shib",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 55,
  //     "code": "LINK",
  //     "name": "Chainlink",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 10,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/link.svg",
  //     "track": true,
  //     "cg_id": "chainlink",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": "0x514910771af9ca656af840dff83e8264ecf986ca",
  //     "network_precision": "18",
  //     "explorer_link_hash": "https://eth-explorer.nownodes.io/tx/:hash",
  //     "precision": 8,
  //     "ticker": "link",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 44,
  //     "code": "DOGE",
  //     "name": "Dogecoin",
  //     "enable": true,
  //     "wallet_regex": "^(D|A|9)[a-km-zA-HJ-NP-Z1-9]{33,34}$",
  //     "priority": 10,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/doge.svg",
  //     "track": true,
  //     "cg_id": "dogecoin",
  //     "is_maxlimit": false,
  //     "network": "doge",
  //     "smart_contract": null,
  //     "network_precision": "8",
  //     "explorer_link_hash": "https://doge-explorer.nownodes.io/tx/:hash",
  //     "precision": 8,
  //     "ticker": "doge",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 69,
  //     "code": "OCEAN",
  //     "name": "Ocean Protocol",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 15,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/ocean.svg",
  //     "track": true,
  //     "cg_id": "ocean-protocol",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": "0x967da4048cd07ab37855c090aaf366e4ce1b9f48",
  //     "network_precision": "18",
  //     "explorer_link_hash": "https://eth-explorer.nownodes.io/tx/:hash",
  //     "precision": 8,
  //     "ticker": "ocean",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 71,
  //     "code": "DOT",
  //     "name": "Polkadot",
  //     "enable": true,
  //     "wallet_regex": "^1[0-9a-z-A-Z]{45,50}$",
  //     "priority": 15,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/dot.svg",
  //     "track": true,
  //     "cg_id": "polkadot",
  //     "is_maxlimit": false,
  //     "network": "dot",
  //     "smart_contract": null,
  //     "network_precision": "10",
  //     "explorer_link_hash": "https://bscscan.com/tx/:hash",
  //     "precision": 8,
  //     "ticker": "dot",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 17,
  //     "code": "BNBMAINNET",
  //     "name": "Binance Coin Mainnet",
  //     "enable": true,
  //     "wallet_regex": "^(bnb1)[0-9a-z]{38}$",
  //     "priority": 16,
  //     "extra_id_exists": true,
  //     "extra_id_regex": "^[0-9A-Za-z\\-_]{1,120}$",
  //     "logo_url": "/images/coins/bnbmainnet.svg",
  //     "track": true,
  //     "cg_id": "binancecoin",
  //     "is_maxlimit": false,
  //     "network": "bnb",
  //     "smart_contract": null,
  //     "network_precision": "8",
  //     "explorer_link_hash": null,
  //     "precision": 8,
  //     "ticker": "bnb",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 18,
  //     "code": "XLM",
  //     "name": "Stellar Lumens",
  //     "enable": true,
  //     "wallet_regex": "G[A-D]{1}[A-Z2-7]{54}$",
  //     "priority": 18,
  //     "extra_id_exists": true,
  //     "extra_id_regex": "^[0-9A-Za-z]{1,28}$",
  //     "logo_url": "/images/coins/xlm.svg",
  //     "track": true,
  //     "cg_id": "stellar",
  //     "is_maxlimit": false,
  //     "network": "xlm",
  //     "smart_contract": null,
  //     "network_precision": "7",
  //     "explorer_link_hash": null,
  //     "precision": 8,
  //     "ticker": "xlm",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 21,
  //     "code": "ADA",
  //     "name": "Cardano",
  //     "enable": true,
  //     "wallet_regex": "^([1-9A-HJ-NP-Za-km-z]{59,104})|([0-9A-Za-z]{58,104})$",
  //     "priority": 21,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/ada.svg",
  //     "track": false,
  //     "cg_id": "cardano",
  //     "is_maxlimit": false,
  //     "network": "ada",
  //     "smart_contract": null,
  //     "network_precision": "6",
  //     "explorer_link_hash": null,
  //     "precision": 8,
  //     "ticker": "ada",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 22,
  //     "code": "XRP",
  //     "name": "Ripple",
  //     "enable": true,
  //     "wallet_regex": "^r[1-9A-HJ-NP-Za-km-z]{25,34}$",
  //     "priority": 21,
  //     "extra_id_exists": true,
  //     "extra_id_regex": "^([0-9]{1,19})$",
  //     "logo_url": "/images/coins/xrp.svg",
  //     "track": true,
  //     "cg_id": "ripple",
  //     "is_maxlimit": false,
  //     "network": "xrp",
  //     "smart_contract": null,
  //     "network_precision": "6",
  //     "explorer_link_hash": "https://xrpscan.com/tx/:hash",
  //     "precision": 8,
  //     "ticker": "xrp",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 23,
  //     "code": "XMR",
  //     "name": "Monero",
  //     "enable": true,
  //     "wallet_regex": "^[48][a-zA-Z|\\d]{94}([a-zA-Z|\\d]{11})?$",
  //     "priority": 22,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/xmr.svg",
  //     "track": true,
  //     "cg_id": "monero",
  //     "is_maxlimit": false,
  //     "network": "xmr",
  //     "smart_contract": null,
  //     "network_precision": "12",
  //     "explorer_link_hash": "https://blockchair.com/monero/transaction/:hash",
  //     "precision": 8,
  //     "ticker": "xmr",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 81,
  //     "code": "SOL",
  //     "name": "Solana",
  //     "enable": true,
  //     "wallet_regex": "[1-9A-HJ-NP-Za-km-z]{32,44}",
  //     "priority": 40,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/sol.svg",
  //     "track": true,
  //     "cg_id": "solana",
  //     "is_maxlimit": false,
  //     "network": "sol",
  //     "smart_contract": null,
  //     "network_precision": "9",
  //     "explorer_link_hash": null,
  //     "precision": 8,
  //     "ticker": "sol",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 39,
  //     "code": "BUSD",
  //     "name": "Binance USD",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 40,
  //     "extra_id_exists": false,
  //     "extra_id_regex": "",
  //     "logo_url": "/images/coins/busd.svg",
  //     "track": true,
  //     "cg_id": "binance-usd",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
  //     "network_precision": "18",
  //     "explorer_link_hash": "https://eth-explorer.nownodes.io/tx/:hash",
  //     "precision": 8,
  //     "ticker": "busd",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 96,
  //     "code": "BNBBSC",
  //     "name": "Binance Coin (BSC)",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 96,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/bnbbsc.svg",
  //     "track": true,
  //     "cg_id": "binancecoin",
  //     "is_maxlimit": false,
  //     "network": "bsc",
  //     "smart_contract": null,
  //     "network_precision": "18",
  //     "explorer_link_hash": "https://bscscan.com/tx/:hash",
  //     "precision": 8,
  //     "ticker": "bnb",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 126,
  //     "code": "FLOKI",
  //     "name": "Floki (ERC20)",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 132,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/floki.svg",
  //     "track": true,
  //     "cg_id": "floki-inu",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": "0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E",
  //     "network_precision": "9",
  //     "explorer_link_hash": "https://bscscan.com/tx/:hash",
  //     "precision": 8,
  //     "ticker": "floki",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 86,
  //     "code": "SHIB",
  //     "name": "Shiba Inu",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 10,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/shib.svg",
  //     "track": true,
  //     "cg_id": "shiba-inu",
  //     "is_maxlimit": true,
  //     "network": "eth",
  //     "smart_contract": "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
  //     "network_precision": "18",
  //     "explorer_link_hash": "https://eth-explorer.nownodes.io/tx/:hash",
  //     "precision": 8,
  //     "ticker": "shib",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 153,
  //     "code": "ILV",
  //     "name": "Illuvium",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 167,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/ilv.svg",
  //     "track": true,
  //     "cg_id": "illuvium",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": "0x767fe9edc9e0df98e07454847909b5e959d7ca0e",
  //     "network_precision": "18",
  //     "explorer_link_hash": null,
  //     "precision": 8,
  //     "ticker": "ilv",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 174,
  //     "code": "APE",
  //     "name": "ApeCoin",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 174,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/ape.png",
  //     "track": true,
  //     "cg_id": "apecoin",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": "0x4d224452801aced8b2f0aebe155379bb5d594381",
  //     "network_precision": "18",
  //     "explorer_link_hash": null,
  //     "precision": 8,
  //     "ticker": "ape",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 313,
  //     "code": "KAS",
  //     "name": "Kaspa",
  //     "enable": true,
  //     "wallet_regex": "^(kaspa:)[0-9a-z]{60,71}$",
  //     "priority": 200,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/kas.svg",
  //     "track": true,
  //     "cg_id": "kas",
  //     "is_maxlimit": false,
  //     "network": "kas",
  //     "smart_contract": null,
  //     "network_precision": null,
  //     "explorer_link_hash": null,
  //     "precision": 8,
  //     "ticker": "kas",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 245,
  //     "code": "ARB",
  //     "name": "Arbitrum",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 200,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/arbitrum.svg",
  //     "track": true,
  //     "cg_id": "arb",
  //     "is_maxlimit": false,
  //     "network": "arbitrum",
  //     "smart_contract": "0x912CE59144191C1204E64559FE8253a0e49E6548",
  //     "network_precision": "18",
  //     "explorer_link_hash": null,
  //     "precision": 8,
  //     "ticker": "arb",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 424,
  //     "code": "DADDY",
  //     "name": "Daddy Tate",
  //     "enable": true,
  //     "wallet_regex": "^[1-9A-HJ-NP-Za-km-z]{32,44}$",
  //     "priority": 203,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/daddy.svg",
  //     "track": true,
  //     "cg_id": "daddy",
  //     "is_maxlimit": false,
  //     "network": "sol",
  //     "smart_contract": "4Cnk9EPnW5ixfLZatCPJjDB1PUtcRpVVgTQukm9epump",
  //     "network_precision": null,
  //     "explorer_link_hash": null,
  //     "precision": 6,
  //     "ticker": "daddy",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": "false",
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 348,
  //     "code": "PEPE",
  //     "name": "Pepe",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 203,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/pepeerc20.svg",
  //     "track": true,
  //     "cg_id": "pepe",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": null,
  //     "network_precision": null,
  //     "explorer_link_hash": "https://blockexplorers.nownodes.io/ethereum/tx/$$",
  //     "precision": 8,
  //     "ticker": "pepe",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": null,
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  //   {
  //     "id": 440,
  //     "code": "INJMAINNET",
  //     "name": "Injective Protocol",
  //     "enable": true,
  //     "wallet_regex": "^(inj1)[0-9a-z]{38}$",
  //     "priority": 203,
  //     "extra_id_exists": false,
  //     "extra_id_regex": "^[0-9A-Za-z\\\\-_]{1,120}$",
  //     "logo_url": "/images/coins/injmainnet.svg",
  //     "track": true,
  //     "cg_id": "injmainnet",
  //     "is_maxlimit": false,
  //     "network": "inj",
  //     "smart_contract": null,
  //     "network_precision": null,
  //     "explorer_link_hash": null,
  //     "precision": 8,
  //     "ticker": "inj",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": "false",
  //     "created_at": "2024-09-26T14:31:42.404Z",
  //     "updated_at": "2024-09-26T14:31:42.404Z"
  //   },
  //   {
  //     "id": 442,
  //     "code": "CGPT",
  //     "name": "ChainGPT (Ethereum)",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 203,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/cgpt.svg",
  //     "track": true,
  //     "cg_id": "cgpt",
  //     "is_maxlimit": false,
  //     "network": "eth",
  //     "smart_contract": "0x25931894a86D47441213199621F1F2994e1c39Aa",
  //     "network_precision": null,
  //     "explorer_link_hash": null,
  //     "precision": 8,
  //     "ticker": "cgpt",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": "false",
  //     "created_at": "2024-09-27T16:05:46.035Z",
  //     "updated_at": "2024-09-27T16:05:46.035Z"
  //   },
  //   {
  //     "id": 412,
  //     "code": "BRETTBASE",
  //     "name": "Brett (Based)",
  //     "enable": true,
  //     "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
  //     "priority": 203,
  //     "extra_id_exists": false,
  //     "extra_id_regex": null,
  //     "logo_url": "/images/coins/brett.svg",
  //     "track": true,
  //     "cg_id": "brettbase",
  //     "is_maxlimit": false,
  //     "network": "base",
  //     "smart_contract": "0x532f27101965dd16442e59d40670faf5ebb142e4",
  //     "network_precision": null,
  //     "explorer_link_hash": null,
  //     "precision": 8,
  //     "ticker": "brett",
  //     "is_defi": false,
  //     "is_popular": false,
  //     "is_stable": false,
  //     "available_for_to_conversion": true,
  //     "trust_wallet_id": "false",
  //     "created_at": "2024-08-28T16:06:33.998Z",
  //     "updated_at": "2024-08-28T16:06:33.998Z"
  //   },
  // ]}

  let list={
    "currencies": [
        {
            "id": 1,
            "code": "BTC",
            "name": "Bitcoin",
            "enable": true,
            "wallet_regex": "^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^(bc1|BC1)[0-9A-Za-z]{39,59}$",
            "priority": 0,
            "extra_id_exists": false,
            "extra_id_regex": null,
            "logo_url": "/images/coins/btc.svg",
            "track": true,
            "cg_id": "bitcoin",
            "is_maxlimit": false,
            "network": "btc",
            "smart_contract": null,
            "network_precision": "8",
            "explorer_link_hash": "https://btc-explorer.nownodes.io/tx/:hash",
            "precision": 8,
            "ticker": "btc",
            "is_defi": false,
            "is_popular": false,
            "is_stable": false,
            "available_for_to_conversion": true,
            "trust_wallet_id": "c0",
            "created_at": "2024-08-28T16:06:33.998Z",
            "updated_at": "2024-08-28T16:06:33.998Z"
        },
        {
            "id": 15,
            "code": "ETH",
            "name": "Ethereum",
            "enable": true,
            "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
            "priority": 1,
            "extra_id_exists": false,
            "extra_id_regex": null,
            "logo_url": "/images/coins/eth.svg",
            "track": true,
            "cg_id": "ethereum",
            "is_maxlimit": false,
            "network": "eth",
            "smart_contract": null,
            "network_precision": "18",
            "explorer_link_hash": "https://eth-explorer.nownodes.io/tx/:hash",
            "precision": 8,
            "ticker": "eth",
            "is_defi": false,
            "is_popular": false,
            "is_stable": false,
            "available_for_to_conversion": true,
            "trust_wallet_id": "c60_t",
            "created_at": "2024-08-28T16:06:33.998Z",
            "updated_at": "2024-08-28T16:06:33.998Z"
        },
        {
            "id": 30,
            "code": "USDTERC20",
            "name": "Tether USD (Ethereum)",
            "enable": true,
            "wallet_regex": "^(0x)[0-9A-Fa-f]{40}$",
            "priority": 29,
            "extra_id_exists": false,
            "extra_id_regex": null,
            "logo_url": "/images/coins/usdterc20.svg",
            "track": true,
            "cg_id": "tether",
            "is_maxlimit": false,
            "network": "eth",
            "smart_contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            "network_precision": "6",
            "explorer_link_hash": "https://eth-explorer.nownodes.io/tx/:hash",
            "precision": 6,
            "ticker": "usdt",
            "is_defi": false,
            "is_popular": true,
            "is_stable": true,
            "available_for_to_conversion": true,
            "trust_wallet_id": null,
            "created_at": "2024-08-28T16:06:33.998Z",
            "updated_at": "2024-08-28T16:06:33.998Z"
        },
        {
            "id": 52,
            "code": "USDTTRC20",
            "name": "Tether USD (Tron)",
            "enable": true,
            "wallet_regex": "^T[1-9A-HJ-NP-Za-km-z]{33}$",
            "priority": 10,
            "extra_id_exists": false,
            "extra_id_regex": null,
            "logo_url": "/images/coins/usdttrc20.svg",
            "track": true,
            "cg_id": "tether",
            "is_maxlimit": false,
            "network": "trx",
            "smart_contract": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
            "network_precision": "6",
            "explorer_link_hash": "https://tronscan.org/#/transaction/:hash",
            "precision": 6,
            "ticker": "usdt",
            "is_defi": false,
            "is_popular": true,
            "is_stable": true,
            "available_for_to_conversion": true,
            "trust_wallet_id": null,
            "created_at": "2024-08-28T16:06:33.998Z",
            "updated_at": "2024-08-28T16:06:33.998Z"
        },
        {
            "id": 81,
            "code": "SOL",
            "name": "Solana",
            "enable": true,
            "wallet_regex": "[1-9A-HJ-NP-Za-km-z]{32,44}",
            "priority": 40,
            "extra_id_exists": false,
            "extra_id_regex": null,
            "logo_url": "/images/coins/sol.svg",
            "track": true,
            "cg_id": "solana",
            "is_maxlimit": false,
            "network": "sol",
            "smart_contract": null,
            "network_precision": "9",
            "explorer_link_hash": null,
            "precision": 8,
            "ticker": "sol",
            "is_defi": false,
            "is_popular": false,
            "is_stable": false,
            "available_for_to_conversion": true,
            "trust_wallet_id": null,
            "created_at": "2024-08-28T16:06:33.998Z",
            "updated_at": "2024-08-28T16:06:33.998Z"
        }
    ]
  }
  return res.status(200).json({
    success: true,
    message: "Currency list",
    data: list
  });
}

exports.depositInitiate = async (req, res) => {
  let data = JSON.stringify({
    "email": nowpayEmail,
    "password": nowpayPassword
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: baseUrlPayment + 'auth',
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  };

  axios.request(config)
    .then((response) => {
      let orderId = "order_" + randomstring.generate({
        length: 8,
        charset: 'alphabetic'
      });
      //         console.log(req.body)

      let data2 = JSON.stringify({
        "price_amount": req.body.amount,
        "price_currency": req.body.priceCurrency || "usd",
        "pay_currency": req.body.payCurrency,
        "ipn_callback_url": backendBaseUrl+"payment/webhook2",
        "order_id": orderId,
        "order_description": "Create payment"
      });

      try {
        let config2 = {
          method: 'POST',
          maxBodyLength: Infinity,
          url: baseUrlPayment + "payment",
          headers: {
            'Authorization': "Bearer " + response.data.token,
            'x-api-key': process.env.NOWPAYMENT_API_KEY,
            "Content-Type": "application/json"
          },
          data: data2
        };
        axios.request(config2)
          .then(async (response2) => {
            console.log(JSON.stringify(response2.data));

            await models.payment.create({
              userId: req.authUser.id,
              paymentId: response2.data.payment_id,
              paymentStatus: response2.data.payment_status,
              payAddress: response2.data.pay_address,
              priceAmount: response2.data.price_amount,
              priceCurrency: response2.data.price_currency,
              payAmount: response2.data.pay_amount,
              amountReceived: response2.data.amount_received,
              payCurrency: response2.data.pay_currency,
              orderId: response2.data.order_id,
              orderDescription: response2.data.order_description,
              purchaseId: response2.data.purchase_id,
              network: response2.data.network,
              networkPrecision: response2.data.network_precision,
              burningPercent: response2.data.burning_percent,
              isFixedRate: response2.data.is_fixed_rate,
              isFeePaidByUser: response2.data.is_fee_paid_by_user,
              paymentInitiateType: response2.data.type
            })

            return res.status(200).json({
              success: true,
              message: "Payment initiate successfully",
              data: response2.data
            });
          })
          .catch((error) => {
            console.log(error)
            return res.status(500).json({
              success: false,
              message: "Error in payment initiate",
              error: error.message
            });
          });
      } catch (e) {
        return res.status(500).json({
          success: false,
          message: "Error in payment initiates",
          error: e.message
        });
      }
    }).catch((error) => {
      return res.status(500).json({
        success: false,
        message: "Error in auth token",
        error: error.message
      });
    })
}

exports.paymentStatus = async (req, res) => {
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: baseUrlPayment + "payment/" + req.query.paymentId,
      headers: {
        'x-api-key': process.env.NOWPAYMENT_API_KEY
      }
    };
    axios.request(config)
      .then((response) => {
        // console.log(JSON.stringify(response.data));
        return res.status(200).json({
          success: true,
          message: "Payment details",
          data: response.data
        });
      })
      .catch((error) => {
        return res.status(500).json({
          success: false,
          message: "Error in payment details",
          error: error.message
        });
      });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Error in payment details",
      error: e.message
    });
  }
}

// webhook for deposit
exports.paymentWebhook2 = async (req, res) => {
  console.log("webhook................", req.body)
  try {
    await models.payment.update({
      paymentStatus: req.body.payment_status
    },
      {
        where: {
          paymentId: req.body.payment_id
        }
      })
  } catch (e) {
    await models.paymentErrLog.create({
      paymentId: req.body.payment_id,
      paymentStatus: req.body.payment_status,
      location: "from payment status update catch"
    })
    return res.status(500).json({
      success: false,
      message: "Error in update payment list",
    });
  }

  if (req.body.payment_status == "finished") {
    let paymentDetails
    try {
      paymentDetails = await models.payment.findOne({
        where: {
          paymentId: req.body.payment_id
        }
      })
    } catch (e) {
      await models.paymentErrLog.create({
        paymentId: req.body.payment_id,
        paymentStatus: req.body.payment_status,
        location: "from payment status finish update catch"
      })
      return res.status(500).json({
        success: false,
        message: "Error in finding user",
      });
    }
    try {
      await models.payment.update({
        actuallyPaid: req.body.actually_paid,
        fee: req.body.fee,
        invoiceId: req.body.invoice_id,
        outcomeAmount: req.body.outcome_amount,
        outcomeCurrency: req.body.outcome_currency,
        // payAddress: req.body.pay_address,
        payAmount: req.body.pay_amount,
        payCurrency: req.body.pay_currency,
        paymentId: req.body.payment_id,
        paymentStatus: req.body.payment_status,
        priceAmount: req.body.price_amount,
        priceCurrency: req.body.price_currency,
        purchaseId: req.body.purchase_id,
        paidAt: req.body.updated_at,
        actuallPaidAtFiat: req.body.actually_paid_at_fiat,
      }, {
        where: {
          paymentId: req.body.payment_id
        }
      })
    } catch (e) {
      await models.paymentErrLog.create({
        paymentId: req.body.payment_id,
        paymentStatus: req.body.payment_status,
        location: "from payment status finish update catch2"
      })

      return res.status(500).json({
        success: false,
        message: "Error in create payment",
      });
    }
    // if(req.body.payment_status == "partially_paid"){
    //   req.body.price_amount=req.body.actually_paid
    // }
    try {
      let balanceDetails = await models.balance.findOne({
        where: { userId: paymentDetails.userId }
      });
      // console.log("userDetails: ", userDetails);
      let depositMoney = Number(balanceDetails.depositMoney) + Number(req.body.price_amount)
      let availableBalance = Number(balanceDetails.availableBalance) + Number(req.body.price_amount)
      await models.balance.update({
        depositMoney: depositMoney,
        availableBalance: availableBalance,
      }, {
        where: {
          userId: paymentDetails.userId
        }
      });

      let userDetails = await models.user.findOne({
        where: { id: paymentDetails.userId }
      })
      let totalDeposit = Number(userDetails.totalDeposit) + Number(req.body.price_amount)
      await models.user.update({
        // isFirstDeposit: false,
        totalDeposit: totalDeposit
      }, {
        where: {
          id: paymentDetails.userId
        }
      })

      // console.log(req.body.price_amount, userDetails.isFirstDeposit, userDetails.codeCreatedByUserId)
      // adding promo money to the user who invited
      if (req.body.price_amount >= 15 && userDetails && userDetails.isFirstDeposit == true && userDetails.codeCreatedByUserId) {
        promoForInvite = 15;
        let codeCreatedByUserId = userDetails.codeCreatedByUserId;
        let referralCode = userDetails.referralCode;

        // let userInviteDetail = await models.userInvite.findOne({
        //   where: {
        //     code: referralCode,
        //     userId: codeCreatedByUserId
        //   }
        // });

        await models.payment.create({
          userId: codeCreatedByUserId,
          priceAmount: promoForInvite,
          paymentType: "PROMO",
          promoById: paymentDetails.userId,
          description: "For reference " + referralCode,
          paymentMode: "PROMO",
          paymentStatus: "finished",
        });

        await models.user.update({
          isFirstDeposit: false,
        }, {
          where: {
            id: paymentDetails.userId
          }
        })

        // await models.userInviteByCode.update({
        //   promoGiven: true
        // }, {
        //   where: {
        //     userId: codeCreatedByUserId,
        //     email: 
        //   }
        // })

        let balanceDetails = await models.balance.findOne({
          where: { userId: codeCreatedByUserId }
        });
        // console.log("userDetails: ", userDetails);
        let availablePromo = Number(balanceDetails.availablePromo) + Number(promoForInvite)
        let promoMoney = Number(balanceDetails.promoMoney) + Number(promoForInvite)
        await models.balance.update({
          availablePromo: availablePromo,
          promoMoney: promoMoney,
        }, {
          where: {
            userId: codeCreatedByUserId
          }
        });
      }

    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Error in update balance",
      });
    }
  }else if(req.body.payment_status == "partially_paid"){
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: conversionUrl + "?tid=" + tid + "&amount=" + req.body.pay_amount + "&fromCurrency=" + req.body.pay_currency.toUpperCase() + "&toCurrency=USD",
      headers: {
        'x-api-key': process.env.NOWPAYMENT_API_KEY,
      },
    };
    
    axios.request(config)
      .then(async (response) => {
        let actualAmount=req.body.price_amount
        req.body.price_amount=response.data.estimated_amount
        req.body.price_amount=Number(req.body.price_amount.toFixed(2))
        console.log(req.body.price_amount)
        // return false
        let paymentDetails
    try {
      paymentDetails = await models.payment.findOne({
        where: {
          paymentId: req.body.payment_id
        }
      })
    } catch (e) {
      await models.paymentErrLog.create({
        paymentId: req.body.payment_id,
        paymentStatus: req.body.payment_status,
        location: "from payment status finish update catch"
      })
      return res.status(500).json({
        success: false,
        message: "Error in finding user",
      });
    }
    try {
      await models.payment.update({
        actuallyPaid: req.body.actually_paid,
        fee: req.body.fee,
        invoiceId: req.body.invoice_id,
        outcomeAmount: req.body.outcome_amount,
        outcomeCurrency: req.body.outcome_currency,
        // payAddress: req.body.pay_address,
        payAmount: req.body.pay_amount,
        payCurrency: req.body.pay_currency,
        paymentId: req.body.payment_id,
        paymentStatus: req.body.payment_status,
        priceAmount: req.body.price_amount,
        priceCurrency: req.body.price_currency,
        purchaseId: req.body.purchase_id,
        paidAt: req.body.updated_at,
        actuallPaidAtFiat: req.body.actually_paid_at_fiat,
        priceAmountForPartial: actualAmount
      }, {
        where: {
          paymentId: req.body.payment_id
        }
      })
    } catch (e) {
      await models.paymentErrLog.create({
        paymentId: req.body.payment_id,
        paymentStatus: req.body.payment_status,
        location: "from payment status finish update catch2"
      })

      return res.status(500).json({
        success: false,
        message: "Error in create payment",
      });
    }
    try {
      let balanceDetails = await models.balance.findOne({
        where: { userId: paymentDetails.userId }
      });
      // console.log("userDetails: ", userDetails);
      let depositMoney = Number(balanceDetails.depositMoney) + Number(req.body.price_amount)
      let availableBalance = Number(balanceDetails.availableBalance) + Number(req.body.price_amount)
      await models.balance.update({
        depositMoney: depositMoney,
        availableBalance: availableBalance,
      }, {
        where: {
          userId: paymentDetails.userId
        }
      });

      let userDetails = await models.user.findOne({
        where: { id: paymentDetails.userId }
      })
      let totalDeposit = Number(userDetails.totalDeposit) + Number(req.body.price_amount)
      await models.user.update({
        // isFirstDeposit: false,
        totalDeposit: totalDeposit
      }, {
        where: {
          id: paymentDetails.userId
        }
      })

      // console.log(req.body.price_amount, userDetails.isFirstDeposit, userDetails.codeCreatedByUserId)
      // adding promo money to the user who invited
      if (req.body.price_amount >= 15 && userDetails && userDetails.isFirstDeposit == true && userDetails.codeCreatedByUserId) {
        promoForInvite = 15;
        let codeCreatedByUserId = userDetails.codeCreatedByUserId;
        let referralCode = userDetails.referralCode;

        // let userInviteDetail = await models.userInvite.findOne({
        //   where: {
        //     code: referralCode,
        //     userId: codeCreatedByUserId
        //   }
        // });

        await models.payment.create({
          userId: codeCreatedByUserId,
          priceAmount: promoForInvite,
          paymentType: "PROMO",
          promoById: paymentDetails.userId,
          description: "For reference " + referralCode,
          paymentMode: "PROMO",
          paymentStatus: "finished",
        });

        await models.user.update({
          isFirstDeposit: false,
        }, {
          where: {
            id: paymentDetails.userId
          }
        })

        // await models.userInviteByCode.update({
        //   promoGiven: true
        // }, {
        //   where: {
        //     userId: codeCreatedByUserId,
        //     email: 
        //   }
        // })

        let balanceDetails = await models.balance.findOne({
          where: { userId: codeCreatedByUserId }
        });
        // console.log("userDetails: ", userDetails);
        let availablePromo = Number(balanceDetails.availablePromo) + Number(promoForInvite)
        let promoMoney = Number(balanceDetails.promoMoney) + Number(promoForInvite)
        await models.balance.update({
          availablePromo: availablePromo,
          promoMoney: promoMoney,
        }, {
          where: {
            userId: codeCreatedByUserId
          }
        });
      }

    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Error in update balance",
      });
    }
      })
  }

  return res.status(200).json({
    success: true,
    message: "success",
  });
}

exports.invoiceToCheckConversion = async (req, res) => {
  const v = new niv.Validator(req.body, {
    amount: "required"
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

  let orderId = randomstring.generate({
    length: 8,
    charset: 'alphabetic'
  });
  let data = JSON.stringify({
    "price_amount": req.body.amount,
    "price_currency": "usd",
    "order_id": "order_" + orderId,
    "order_description": "For checking conversion",
    // "ipn_callback_url": process.env.IPN_CALLBACK_URL,
    // "success_url": process.env.SUCCESS_URL,
    // "cancel_url": process.env.CANCEL_URL,
    //   "partially_paid_url": "https://nowpayments.io",
    // "is_fixed_rate": true,
    // "is_fee_paid_by_user": false
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: baseUrlPayment + 'invoice',
    headers: {
      'x-api-key': process.env.NOWPAYMENT_API_KEY,
      'Content-Type': 'application/json'
    },
    data: data
  };

  axios.request(config)
    .then(async (response) => {
      console.log(JSON.stringify(response.data));
      let config2 = {
        method: 'get',
        maxBodyLength: Infinity,
        url: invoiceDetailsUrl + 'invoices/' + response.data.id,
        headers: {
          'x-api-key': process.env.NOWPAYMENT_API_KEY,
        },
      };
      axios.request(config2)
        .then(async (response2) => {
          console.log(JSON.stringify(response2.data));
          return res.status(200).json({
            success: true,
            message: "Invoice details",
            data: response2.data
          });
        }).catch((error) => {
          console.log(error)
          return res.status(500).json({
            success: false,
            message: "Err in Invoice details",
            error: error.message
          });
        })
    })

    .catch((error) => {
      console.log(error);
    });

}

exports.haveConversionData = async (req, res) => {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: conversionUrl + "?tid=" + req.query.tid + "&amount=" + req.query.amount + "&fromCurrency=" + req.query.fromCurrency.toUpperCase() + "&toCurrency=" + req.query.toCurrency.toUpperCase(),
    headers: {}
  };

  axios.request(config)
    .then((response) => {
      return res.status(200).json({
        success: true,
        message: "Conversion details",
        data: response.data
      });
    })
    .catch((error) => {
      return res.status(500).json({
        success: false,
        message: "Can not process with this currency",
        error: error.message
      });
    });

}

exports.sendWithdrawRequest = async (req, res) => {
  const v = new niv.Validator(req.body, {
    address: "required",
    currency: "required",
    amount: "required",
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

  let userBalance
  try {
    userBalance = await models.balance.findOne({
      where: { userId: req.authUser.id }
    })
  } catch (e) {
    console.log(e)
    return res.status(500).json({
      success: false,
      message: "Error in checking balance",
      error: e.message
    });
  }

  let data = JSON.stringify({
    "address": req.body.address,
    "currency": req.body.currency
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: baseUrlPayment + 'payout/validate-address',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.NOWPAYMENT_API_KEY
    },
    data: data
  };

  axios.request(config)
    .then(async (response) => {


      if (Number(userBalance.availablePromo) + Number(userBalance.availableBalance) <= Number(req.body.amount)) {
        return res.status(400).json({
          success: false,
          message: "Not enough balance"
        });
      }

      try {
        await models.payment.create({
          paymentMode: "WITHDRAW",
          approveStatus: "PENDING",
          paymentType: "WITHDRAW",
          payAddress: req.body.address,
          payCurrency: req.body.currency,
          priceAmount: req.body.amount,
          userId: req.authUser.id
        })
      } catch (e) {
        return res.status(500).json({
          success: false,
          message: "Error in create deposit request",
          error: e.message
        });
      }

      let availableBalance = Number(userBalance.availableBalance) - Number(req.body.amount)

      try {
        await models.balance.update(
          {
            availableBalance: availableBalance
          }, {
          where: { userId: req.authUser.id }
        })
      } catch (e) {
        return res.status(500).json({
          success: false,
          message: "Error in updating balance",
          error: e.message
        });
      }

      return res.status(200).json({
        success: true,
        message: "Withdraw request send successfully"
      });
    }).catch((e) => {
      return res.status(400).json({
        success: false,
        message: "Address is not correct"
      });
    })
}

exports.withdrawInitiate = async (req, res) => {
  const v = new niv.Validator(req.body, {
    paymentId: "required",
    approved: "required",
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

  let paymentDetails
  try {
    paymentDetails = await models.payment.findOne({
      where: {
        id: req.body.paymentId
      }
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in finding payment details"
    });
  }
  if (req.body.approved == false) {
    try {
      await models.payment.update({
        approveStatus: "REJECT"
      }, {
        where: {
          id: req.body.paymentId
        }
      })
    } catch (e) {
      return res.status(500).send({
        success: false,
        message: "Error in update withdraw rejection"
      });
    }
    let userBalance
    try {
      userBalance = await models.balance.findOne({
        where: { userId: paymentDetails.userId }
      })
    } catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        message: "Error in checking balance",
        error: e.message
      });
    }

    let availableBalance = Number(userBalance.availableBalance) + Number(paymentDetails.priceAmount)

    try {
      await models.balance.update(
        {
          availableBalance: availableBalance
        }, {
        where: { userId: paymentDetails.userId }
      })

      return res.status(200).json({
        success: true,
        message: "Withdraw request rejected successfully"
      });

    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Error in updating balance",
        error: e.message
      });

    }
  } else {
    let data = JSON.stringify({
      "email": nowpayEmail,
      "password": nowpayPassword
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: baseUrlPayment + 'auth',
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    axios.request(config)
      .then((response) => {
        let orderId = "order_" + randomstring.generate({
          length: 8,
          charset: 'alphabetic'
        });
        //         console.log(req.body)

        let data2 = JSON.stringify({
          "ipn_callback_url": backendBaseUrl+"payment/webhook3",
          "withdrawals": [
            {
              "address": req.body.address,
              "currency": req.body.currency,
              "amount": req.body.amount,
            },
          ]
        });

        try {
          let config2 = {
            method: 'POST',
            maxBodyLength: Infinity,
            url: baseUrlPayment + "payout",
            headers: {
              'Authorization': "Bearer " + response.data.token,
              'x-api-key': process.env.NOWPAYMENT_API_KEY,
              "Content-Type": "application/json"
            },
            data: data2
          };
          axios.request(config2)
            .then(async (response2) => {
              console.log(JSON.stringify(response2.data));
              try {
                await models.payment.update({
                  approveStatus: "APPROVED"
                }, {
                  where: {
                    id: req.body.paymentId
                  }
                })
              } catch (e) {
                return res.status(500).send({
                  success: false,
                  message: "Error in update withdraw approved"
                });
              }
              await models.payment.update({
                // userId: req.authUser.id,
                paymentId: response2.data.id,
                // paymentStatus: response2.data.payment_status,
                // payAddress: response2.data.pay_address,
                // priceAmount: response2.data.price_amount,
                // priceCurrency: response2.data.price_currency,
                // payAmount: response2.data.pay_amount,
                // amountReceived: response2.data.amount_received,
                // payCurrency: response2.data.pay_currency,
                // orderId: response2.data.order_id,
                // orderDescription: response2.data.order_description,
                // purchaseId: response2.data.purchase_id,
                // network: response2.data.network,
                // networkPrecision: response2.data.network_precision,
                // burningPercent: response2.data.burning_percent,
                // isFixedRate: response2.data.is_fixed_rate,
                // isFeePaidByUser: response2.data.is_fee_paid_by_user,
                // paymentInitiateType: response2.data.type
              }, {
                where: {
                  id: req.body.paymentId
                }
              })

              let config3 = {
                method: 'get',
                maxBodyLength: Infinity,
                url: baseUrlPayment + "payout/" + response2.data.id + "/verify",
                headers: {
                  'x-api-key': process.env.NOWPAYMENT_API_KEY,
                  'Authorization': "Bearer " + response.data.token,
                }
              };
              axios.request(config)
                .then((response3) => {
                  return res.status(200).json({
                    success: true,
                    message: "Payment initiate successfully",
                    data: response2.data
                  });
                })
            }).catch((e) => {
              console.log(error)
              return res.status(500).json({
                success: false,
                message: "Error in verify payout",
                error: error.message
              });
            })
            .catch((error) => {
              console.log(error)
              return res.status(500).json({
                success: false,
                message: "Error in payment initiate",
                error: error.message
              });
            });
        } catch (e) {
          return res.status(500).json({
            success: false,
            message: "Error in payment initiates",
            error: e.message
          });
        }
      }).catch((error) => {
        return res.status(500).json({
          success: false,
          message: "Error in auth token",
          error: error.message
        });
      })
  }
}

// webhook for withdraw
exports.paymentWebhook3 = async (req, res) => {
  console.log("webhook................", req.body)
  if (Array.isArray(req.body)) {
    req.body = req.body[0]
  }
  // return false;
  try {
    await models.payment.update({
      paymentStatus: req.body.payment_status
    },
      {
        where: {
          paymentId: req.body.payment_id
        }
      })
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Error in update payment list",
    });
  }

  if (req.body.payment_status == "finished") {
    let paymentDetails
    try {
      paymentDetails = await models.payment.findOne({
        where: {
          paymentId: req.body.payment_id
        }
      })
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Error in finding user",
      });
    }
    try {
      await models.payment.update({
        actuallyPaid: req.body.actually_paid,
        fee: req.body.fee,
        invoiceId: req.body.invoice_id,
        outcomeAmount: req.body.outcome_amount,
        outcomeCurrency: req.body.outcome_currency,
        // payAddress: req.body.pay_address,
        payAmount: req.body.pay_amount,
        payCurrency: req.body.pay_currency,
        paymentId: req.body.payment_id,
        paymentStatus: req.body.payment_status,
        priceAmount: req.body.price_amount,
        priceCurrency: req.body.price_currency,
        purchaseId: req.body.purchase_id,
        paidAt: req.body.updated_at,
      }, {
        where: {
          paymentId: req.body.payment_id
        }
      })
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Error in create payment",
      });
    }

    try {
      let userDetails = await models.balance.findOne({
        where: { id: paymentDetails.userId }
      })
      let depositMoney = Number(userDetails.depositMoney) - Number(req.body.price_amount)
      await models.user.update({
        depositMoney: depositMoney
      }, {
        where: {
          id: paymentDetails.userId
        }
      })

      // if (userDetails && userDetails.isFirstDeposit == true) {
      //   let codeCreatedByUserId = paymentDetails.codeCreatedByUserId;

      // }

    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Error in update balance",
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: "success",
  });
}
