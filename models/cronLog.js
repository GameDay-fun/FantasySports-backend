"use strict";

module.exports = (sequelize, DataTypes) => {
    const cronLog = sequelize.define(
        "cronLog",
        {
            cronName: {
                type: DataTypes.TEXT,
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
    return cronLog;
};
