"use strict";

module.exports = (sequelize, DataTypes) => {
    const balanceUpdateLog = sequelize.define(
        "balanceUpdateLog",
        {
            userId: {
                type: DataTypes.INTEGER,
            },
            balanceWas: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0,
            },
            newBalance: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0,
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

    return balanceUpdateLog;
};
