"use strict";
const appConfig = require("../../configurations/appConfig.js");
const debug = require("debug")(appConfig.APP_NAME + ":Model:User");
const Moment = require("moment");
const Joi = require("joi");

module.exports = (SequelizeDB, DataTypes) => {
  let Movie = SequelizeDB.define("Movie", {
    movieID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    numberInStock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    dailyRentalRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
  });

  Movie.associate = (models) => {
    /**
     * With Users Table
     */

    models.Movie.belongsTo(models.Genre, {
      // onDelete: "CASCADE",
      as: "Genre",
      foreignKey: {
        name: "genreID",
        allowNull: true,
      },
    });
  };

  return Item;
};
