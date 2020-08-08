"use strict";
const appConfig = require("../../configurations/appConfig.js");
const debug = require("debug")(appConfig.APP_NAME + ":Model:User");
const Moment = require("moment");
const Joi = require("joi");

module.exports = (SequelizeDB, DataTypes) => {
  let User = SequelizeDB.define("User", {
    UserID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      schema: Joi.string().required().min(3).label("User Name"),
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      schema: Joi.string().email().required().label("User Email"),
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      schema: Joi.string().required().min(4).label("User Password"),
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1,
    },
  });

  User.associate = (models) => {
    /**
     * With Users Table
     */
  };

  return User;
};
