"use strict";

module.exports = (sequelize, DataTypes) => {
  const game = sequelize.define(
    "game",
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
      externalGameId: {
        type: DataTypes.TEXT,
      },
      resultFound:{
        type: DataTypes.BOOLEAN
      },
      startTime: {
        type: DataTypes.DATE,
      },
      startTimeConfirmed: {
        type: DataTypes.BOOLEAN,
      },
      competitors1Id: {
        type: DataTypes.TEXT,
      },
      competitors1Name: {
        type: DataTypes.TEXT,
      },
      competitors1Country: {
        type: DataTypes.TEXT,
      },
      competitors1CountryCode: {
        type: DataTypes.TEXT,
      },
      competitors1Abbreviation: {
        type: DataTypes.TEXT,
      },
      competitors1Qualifier: {
        type: DataTypes.TEXT,
      },
      competitors1RotationNumber: {
        type: DataTypes.TEXT,
      },
      competitors2Id: {
        type: DataTypes.TEXT,
      },
      competitors2Name: {
        type: DataTypes.TEXT,
      },
      competitors2Country: {
        type: DataTypes.TEXT,
      },
      competitors2CountryCode: {
        type: DataTypes.TEXT,
      },
      competitors2Abbreviation: {
        type: DataTypes.TEXT,
      },
      competitors2Qualifier: {
        type: DataTypes.TEXT,
      },
      competitors2RotationNumber: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM({
          values: ["A", "D"],
        }),
        defaultValue: "A", // A- Active/D - Deleted
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

  return game;
};
