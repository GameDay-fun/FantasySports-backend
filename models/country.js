"use strict";

module.exports = (sequelize, DataTypes) => {
  const country = sequelize.define(
    "country",
    {
      name: {
        type: DataTypes.STRING(100),
      },
      countryCode: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      phoneCode: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
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

  return country;
};
