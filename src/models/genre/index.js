"use strict";
const appConfig = require("../../configurations/appConfig.js");
const debug = require("debug")(appConfig.APP_NAME + ":Model:User");
const Moment = require("moment");
const Joi = require("joi");

module.exports = (SequelizeDB, DataTypes) => {
  let Genre = SequelizeDB.define("Genre", {
    genreID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      description: "User`s full name",
      allowNull: false,
      schema: Joi.string().required().min(5).label("Full Name English"),
    },
  });

  Genre.associate = (models) => {
    /**
     * With Users Table
     */
  };

  return Genre;
};
