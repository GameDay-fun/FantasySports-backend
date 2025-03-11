"use strict";

module.exports = (sequelize, DataTypes) => {
  const payment = sequelize.define(
    "payment",
    {
      userId: {
        type: DataTypes.INTEGER,
      },
      invoiceTableId:{
        type: DataTypes.INTEGER,
      },
      actuallyPaid:{
        type: DataTypes.TEXT,
      },
      fee:{
        type: DataTypes.JSON,
      },
      invoiceId:{
        type: DataTypes.TEXT,
      },
      outcomeAmount:{
        type: DataTypes.TEXT
      },
      outcomeCurrency:{
        type: DataTypes.TEXT,
      },
      payAddress:{
        type: DataTypes.TEXT,
      },
      payAmount:{
        type: DataTypes.TEXT,
      },
      payCurrency:{
        type: DataTypes.TEXT,
      },
      amountReceived:{
        type: DataTypes.TEXT,
      },
      paymentId:{
        type: DataTypes.TEXT,
      },
      paymentStatus:{
        type: DataTypes.TEXT,
      },
      priceAmount:{
        type: DataTypes.DECIMAL(10, 2),
      },
      priceCurrency:{
        type: DataTypes.TEXT,
        defaultValue: "USD"
      },
      purchaseId:{
        type: DataTypes.TEXT,
      },
      paidAt:{
        type: DataTypes.TEXT,
      },
      description:{
        type: DataTypes.TEXT,
      },
      orderId:{
        type: DataTypes.TEXT,
      },
      orderDescription:{
        type: DataTypes.TEXT,
      },
      network:{
        type: DataTypes.TEXT,
      },
      networkPrecision:{
        type: DataTypes.TEXT,
      },
      burningPercent:{
        type: DataTypes.TEXT,
      },
      isFixedRate:{
        type: DataTypes.BOOLEAN,
      },
      isFeePaidByUser:{
        type: DataTypes.BOOLEAN,
      },
      paymentInitiateType:{
        type: DataTypes.TEXT
      },
      actuallPaidAtFiat:{
        type: DataTypes.TEXT
      },
      priceAmountForPartial:{
        type: DataTypes.TEXT
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      paymentMode: {
        type: DataTypes.ENUM({
          values: ["DEPOSIT", "WITHDRAW", "PROMO"],
        }),
        defaultValue: "DEPOSIT"
      },
      paymentType: {
        type: DataTypes.ENUM({
          values: ["PROMO", "ADDON", "WITHDRAW", "FUND"],
        }),
        defaultValue: "ADDON"
      },
      approveStatus:{ // for withdraw
        type: DataTypes.ENUM({
          values: ["PENDING", "APPROVED", "REJECT"],
        })
      },
      promoById: {
        type: DataTypes.INTEGER,
      }
    },
    {
      underscored: false,
    }
  );

  payment.associate = function (models) {
    payment.belongsTo(models.user, { foreignKey: "userId", as: "userDetails" });
  };

  return payment;
};
