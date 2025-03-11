"use strict";

module.exports = (sequelize, DataTypes) => {
  const invoice = sequelize.define(
    "invoice",
    {
      userId: {
        type: DataTypes.INTEGER,
      },
      priceAmount:{
        type: DataTypes.DECIMAL(10, 2),
      },
      priceCurrency:{
        type: DataTypes.TEXT,
      },
      invoiceId:{
        type: DataTypes.TEXT,
      },
      invoiceUrl:{
        type: DataTypes.TEXT,
      },
      orderId:{
        type: DataTypes.TEXT,
      },
      orderDescription:{
        type: DataTypes.TEXT,
      },
      isFixedRate:{
        type: DataTypes.BOOLEAN,
      },
      isFeePaidByUser:{
        type: DataTypes.BOOLEAN,
      },
      paid:{
        type: DataTypes.TEXT,
        defaultValue: "pending"
      },
      status: {
        type: DataTypes.ENUM({
          values: ["A", "D"],
        }),
        defaultValue: "A", // A- Active/D - Deleted/I- Inactive
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
    },
    {
      underscored: false,
    }
  );

  return invoice;
};
