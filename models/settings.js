"use strict";

module.exports = (sequelize, DataTypes) => {
    const settings = sequelize.define(
        "settings",
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

    settings.associate = function (models) {
        settings.hasMany(models.multiplexForEntry, { foreignKey: "entryId",targetKey: "id", as: "entryDetails" });
      };
    

    return settings;
};
