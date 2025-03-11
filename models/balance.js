"use strict";

module.exports = (sequelize, DataTypes) => {
  const balance = sequelize.define(
    "balance",
    {
      userId: {
        type: DataTypes.INTEGER,
      },
      promoMoney: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      depositMoney:{
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      availablePromo:{
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      availableBalance:{
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
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

  return balance;
};
