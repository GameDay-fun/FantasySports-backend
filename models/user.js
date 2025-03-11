
"use strict";

module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define(
    "user",
    {
      name: {
        type: DataTypes.TEXT,
      },
      email: {
        type: DataTypes.TEXT,
      },
      password: {
        type: DataTypes.TEXT,
      },
      userType:{
        type: DataTypes.ENUM({
          values: ["ADMIN", "USER"],
        }),
        defaultValue: "USER"
      },
      telegramId: {
        type: DataTypes.TEXT,
      },
      phone: {
        type: DataTypes.TEXT,
      },
      cc: {
        type: DataTypes.TEXT,
      },
      referralCode: {
        type: DataTypes.TEXT,
      },
      colorCode: {
        type: DataTypes.TEXT,
        defaultValue: "#FF335E"
      },
      profileImage: {
        type: DataTypes.TEXT,
      },
      dob: {
        type: DataTypes.DATE,
      },
      gender: {
        type: DataTypes.ENUM({
          values: ["MALE", "FEMALE"],
        }),
        // defaultValue: "MALE",
      },
      twoFactorEnable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      lastloginAt:{
        type: DataTypes.DATE,
      },
      ipAddress:{
        type: DataTypes.TEXT,
      },
      totalDeposit:{
        type: DataTypes.DECIMAL(10, 2),
      },
      totalWagers:{
        type: DataTypes.DECIMAL(10, 2),
      },
      totalWithdrawals:{
        type: DataTypes.DECIMAL(10, 2),
      },
      banned:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      otp: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      otpValideTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resetPassword: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      userStatus: {
        type: DataTypes.ENUM({
          values: ["A", "I", "C"],
        }),
        defaultValue: "I"
      },
      walletBalance:{
        type: DataTypes.DECIMAL(10, 2),
      },
      availableBalance:{
        type: DataTypes.DECIMAL(10, 2),
      },
      promo:{
        type: DataTypes.DECIMAL(10, 2),
      },
      is2fa: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isFirstDeposit: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      codeCreatedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userOwnReferralCode: {
        type: DataTypes.TEXT,
      },
      isUserOwnReferralCodeUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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

  user.associate = function (models) {
    user.belongsTo(models.address, { foreignKey: "id", targetKey: "userId", as: "address" });
    user.belongsTo(models.balance, { foreignKey: "id", targetKey: "userId", as: "balance" });
  };

  return user;
};
