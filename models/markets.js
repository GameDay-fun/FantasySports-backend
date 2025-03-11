"use strict";

module.exports = (sequelize, DataTypes) => {
  const markets = sequelize.define(
    "markets",
    {
      playerTableId:{
        type: DataTypes.INTEGER
      },
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
      marketName:{
        type: DataTypes.TEXT,
      },
      marketShortName:{
        type: DataTypes.TEXT,
      },
      marketId:{
        type: DataTypes.TEXT,
      },
      bookName:{
        type: DataTypes.TEXT,
      },
      books:{
        type: DataTypes.JSON,
      },
      bookId:{
        type: DataTypes.TEXT,
      },
      bookId:{
        type: DataTypes.TEXT,
      },
      bookTotalValue:{
        type: DataTypes.TEXT,
      },
      oddsDecimal:{
        type: DataTypes.TEXT,
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

  return markets;
};
