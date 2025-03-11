"use strict";

module.exports = (sequelize, DataTypes) => {
  const bettingPlayers = sequelize.define(
    "bettingPlayers",
    {
      userId: {
        type: DataTypes.INTEGER,
      },
      playerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      betType: {
        type: DataTypes.ENUM({
          values: ["MORE", "LESS"],
        }),
        allowNull: false,
      },
      bettingId:{
        type: DataTypes.INTEGER,
      },
      marketId: {
        type: DataTypes.INTEGER,
      },
      beforePoint: {
        type: DataTypes.DECIMAL(10, 2),
      },
      afterPoint: {
        type: DataTypes.DECIMAL(10, 2),
      },
      result:{
        type: DataTypes.BOOLEAN,
      },
      status: {
        type: DataTypes.ENUM({
          values: ["A", "D"],
        }),
        defaultValue: "A", // A- Active/D - do not play. so remove from bet list
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

  bettingPlayers.associate = function (models) {
    bettingPlayers.belongsTo(models.players, { foreignKey: "playerId", as: "playerDetails" });
    bettingPlayers.belongsTo(models.markets, { foreignKey: "marketId", as: "marketDetails" });
  };


  return bettingPlayers;
};
