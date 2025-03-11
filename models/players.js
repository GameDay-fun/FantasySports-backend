"use strict";

module.exports = (sequelize, DataTypes) => {
  const players = sequelize.define(
    "players",
    {
      sportsId: {
        type: DataTypes.TEXT,
      },
      sportsTableId:{
        type: DataTypes.INTEGER
      },
      competitionId: {
        type: DataTypes.TEXT,
      },
      gameId: {
        type: DataTypes.TEXT,
      },
      playersId: {
        type: DataTypes.TEXT,
      },
      playerListId: {
        type: DataTypes.INTEGER,
      },
      playerName: {
        type: DataTypes.TEXT,
      },
      startTime: {
        type: DataTypes.DATE,
      },
      competitorId: {
        type: DataTypes.TEXT,
      },
      markets:{
        type: DataTypes.JSON
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

  players.associate = function (models) {
    players.belongsTo(models.game, { foreignKey: "gameId", targetKey: "gameId", as: "gameDetais" });
    players.belongsTo(models.playerList, { foreignKey: "playerListId", as: "playerDetais" });
    players.belongsTo(models.sports, { foreignKey: "sportsId", targetKey: "sportsId", as: "sportDetais" });
    players.hasMany(models.markets, { foreignKey: "playerTableId", targetKey: "id", as: "marketDetails" });
  };

  return players;
};
