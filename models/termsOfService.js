"use strict";

module.exports = (sequelize, DataTypes) => {
    const termsOfService = sequelize.define(
        "termsOfService",
        {
            terms: {
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

    return termsOfService;
};
