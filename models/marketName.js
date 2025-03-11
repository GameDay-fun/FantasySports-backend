"use strict";

module.exports = (sequelize, DataTypes) => {
  const marketName = sequelize.define(
    "marketName",
    {
      marketId:{
        type: DataTypes.TEXT
      },
      sportsId: {
        type: DataTypes.TEXT,
      },
      name:{
        type: DataTypes.TEXT
      },
      shortName: {
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

  return marketName;
};
