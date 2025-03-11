"use strict";

module.exports = (sequelize, DataTypes) => {
    const address = sequelize.define(
        "address",
        {
            userId: {
                type: DataTypes.INTEGER,
            },
            streetAddress: {
                type: DataTypes.TEXT,
            },
            state: {
                type: DataTypes.TEXT,
            },
            country: {
                type: DataTypes.INTEGER,
            },
            city: {
                type: DataTypes.TEXT,
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

    address.associate = function (models) {
        address.belongsTo(models.country, { foreignKey: "country", as: "countryDetails" });
      };

    return address;
};
