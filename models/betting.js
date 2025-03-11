"use strict";

module.exports = (sequelize, DataTypes) => {
  const betting = sequelize.define(
    "betting",
    {
      userId: {
        type: DataTypes.INTEGER,
      },
      deviceId: {
        type: DataTypes.TEXT,
      },
      bettingPlayType:{
        type: DataTypes.INTEGER,
      },
      preBettingPlayType:{
        type: DataTypes.INTEGER,
      },
      inBetbettingPlayType:{
        type: DataTypes.INTEGER,
      },
      inBetPreBettingPlayType:{
        type: DataTypes.INTEGER,
      },
      toWin:{
        type: DataTypes.DECIMAL(10, 2),
      },
      entry:{
        type: DataTypes.DECIMAL(10, 2),
      },
      status: {
        type: DataTypes.ENUM({
          values: ["A", "D"],
        }),
        defaultValue: "A", // A- Active/D - Deleted/I- Inactive
      },
      bettingCategory:{
        type: DataTypes.ENUM({
          values: ["PAST", "OPEN", "FREE"],
        }),
        defaultValue: "OPEN",
      },
      endTime:{
        type: DataTypes.DATE,
      },
      result:{
        type: DataTypes.ENUM({
          values: ["win", "loss", "pending", "refund"],
        }),
        defaultValue: "pending",
      },
      winCount:{
        type: DataTypes.INTEGER,
      },
      resultDecleared:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      minimumPoint: {
        type: DataTypes.DECIMAL(10, 2),
      },
      maximumPoint: {
          type: DataTypes.DECIMAL(10, 2),
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

  betting.associate = function (models) {
    betting.belongsTo(models.settings, { foreignKey: "bettingPlayType", as: "bettingDetais" });
    betting.belongsTo(models.inBetSettings, { foreignKey: "inBetbettingPlayType", as: "inBetBettingDetais" });
    betting.hasMany(models.bettingPlayers, { targetKey: "bettingId", as: "addedPlayers"} );
    betting.belongsTo(models.betResultRecord, {foreignKey: "id", targetKey: "betId", as: "resultDetails"} );
  };

  return betting;
};
