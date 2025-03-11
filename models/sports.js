"use strict";

module.exports = (sequelize, DataTypes) => {
  const sports = sequelize.define(
    "sports",
    {
      name: {
        type: DataTypes.TEXT,
      },
      order:{
        type: DataTypes.INTEGER
      },
      shortName: {
        type: DataTypes.TEXT,
      },
      baseUrl:{
        type: DataTypes.TEXT,
      },
      icon: {
        type: DataTypes.TEXT,
      },
      sportsId: {
        type: DataTypes.TEXT
      },
      type: {
        type: DataTypes.TEXT,
        // allowNull: false,
      },
      status: {
        type: DataTypes.ENUM({
          values: ["A", "D", "I"],
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

  return sports;
};
