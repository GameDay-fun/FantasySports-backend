"use strict";

module.exports = (sequelize, DataTypes) => {
    const help = sequelize.define(
        "help",
        {
            help: {
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

    return help;
};
