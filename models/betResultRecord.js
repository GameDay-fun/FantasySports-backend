"use strict";

module.exports = (sequelize, DataTypes) => {
  const betResultRecord = sequelize.define(
    "betResultRecord",
    {
      userId: {
        type: DataTypes.INTEGER,
      },
      betId: {
        type: DataTypes.INTEGER
      },
      betPlaced:{
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      winAmount:{
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      result:{
        type: DataTypes.TEXT
      },
      betStatus:{
        type: DataTypes.ENUM({
          values: ["PENDING", "DONE"],
        }),
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

  return betResultRecord;
};
