"use strict";
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
      allowNull: false,
      schema: Joi.string().required().min(3).label("Movie Title"),
    },

    numberInStock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      schema: Joi.number().required().label("Number in Stock"),
    },
    dailyRentalRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      schema: Joi.number().required().label("Rnetal Rate "),
    },
  });

  Movie.associate = (models) => {
    /**
     * With Users Table
     */

    models.Movie.belongsTo(models.Genre, {
      onUpdate: "CASCADE",
      as: "Genre",
      foreignKey: {
        name: "genreID",
        allowNull: true,
        schema: Joi.number().required().label("Genre ID "),
      },
    });
  };

  return Movie;
};
