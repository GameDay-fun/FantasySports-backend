"use strict";

module.exports = (sequelize, DataTypes) => {
    const admin = sequelize.define(
        "admin",
        {
            apiToken: {
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
    return admin;
};
