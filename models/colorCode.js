
"use strict";

module.exports = (sequelize, DataTypes) => {
  const colorCode = sequelize.define(
    "colorCode",
    {
      code: {
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
  return colorCode;
};
