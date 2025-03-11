
"use strict";

module.exports = (sequelize, DataTypes) => {
  const userInvite = sequelize.define(
    "userInvite",
    {
      userId: {
        type: DataTypes.INTEGER,
      },
      email: {
        type: DataTypes.TEXT,
      },
      code: {
        type: DataTypes.TEXT,
      },
      promoGiven:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: DataTypes.ENUM({
          values: ["A", "I", "C"],
        }),
        defaultValue: "I"
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


  return userInvite;
};
