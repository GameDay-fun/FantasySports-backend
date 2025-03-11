"use strict";

module.exports = (sequelize, DataTypes) => {
  const playerList = sequelize.define(
    "playerList",
    {
      playersId: {
        type: DataTypes.TEXT,
      },
      sportsTableId:{
        type: DataTypes.INTEGER
      },
      playerName: {
        type: DataTypes.TEXT,
      },
      profileImage: {
        type: DataTypes.TEXT,
      },
      sportsId: {
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
  return playerList;
};
