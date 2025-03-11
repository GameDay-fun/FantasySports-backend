"use strict";

module.exports = (sequelize, DataTypes) => {
  const competitions = sequelize.define(
    "competitions",
    {
      sportsTableId:{
        type: DataTypes.INTEGER
      },
      sportsId: {
        type: DataTypes.TEXT,
        // allowNull: false,
      },
      competitionsId: {
        type: DataTypes.TEXT,
        // allowNull: false,
      },
      name: {
        type: DataTypes.TEXT,
      },
      gender: {
        type: DataTypes.TEXT,
      },
      market:{
        type: DataTypes.BOOLEAN,
      },
      futures:{
        type: DataTypes.BOOLEAN,
      },
      playerProps:{
        type: DataTypes.BOOLEAN,
      },
      categoryId: {
        type: DataTypes.TEXT,
        // allowNull: false,
      },
      categoryName: {
        type: DataTypes.TEXT,
        // allowNull: false,
      },
      categoryCountryCode: {
        type: DataTypes.TEXT,
        // allowNull: false,
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

  return competitions;
};
