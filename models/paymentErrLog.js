"use strict";

module.exports = (sequelize, DataTypes) => {
  const paymentErrLog = sequelize.define(
    "paymentErrLog",
    {
        paymentId: {
        type: DataTypes.TEXT,
      },
      orderId:{
        type: DataTypes.TEXT,
      },
      paymentStatus:{
        type: DataTypes.TEXT,
      },
      location:{
        type: DataTypes.TEXT,
      }
    },
    {
      underscored: false,
    }
  );

  return paymentErrLog;
};
