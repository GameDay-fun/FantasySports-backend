"use strict";

module.exports = (sequelize, DataTypes) => {
    const inBetSettings = sequelize.define(
        "inBetSettings",
        {
            playType: {
                type: DataTypes.ENUM({
                    values: ["FLEX PLAY", "POWER PLAY"],
                }),
            },
            entry: {
                type: DataTypes.INTEGER,
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

    inBetSettings.associate = function (models) {
        inBetSettings.hasMany(models.inBetMultiplexForEntry, { foreignKey: "entryId",targetKey: "id", as: "entryDetails" });
      };
    

    return inBetSettings;
};
