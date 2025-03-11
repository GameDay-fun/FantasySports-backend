"use strict";

module.exports = (sequelize, DataTypes) => {
    const inBetMultiplexForEntry = sequelize.define(
        "inBetMultiplexForEntry",
        {
            entryId: {
                type: DataTypes.INTEGER,
            },
            correctNeeded:{
                type: DataTypes.INTEGER,
            },
            multiplex:{
                type: DataTypes.DECIMAL(10, 2),
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

    return inBetMultiplexForEntry;
};
