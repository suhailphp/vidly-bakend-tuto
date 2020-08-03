"use strict";
const SequelizeDB = require("../configurations/dbConnection");
let sequelize = require("sequelize");
const Fs = require("fs");
const path = require("path");
var appConfig = require("../configurations/appConfig");
var debug = require("debug")(appConfig.APP_NAME + ":Model");
const Joi = require("joi");

module.exports = () => {
  const models = {};

  Fs.readdirSync(__dirname)
    .filter((file) => file.indexOf(".") !== 0 && file !== "index.js")
    .forEach((file) => {
      const model = SequelizeDB.import(path.join(__dirname, file));
      debug("file.name", file, "model.name", model.name);
      models[model.name] = model;
      models[model.name].validate = require(path.join(
        __dirname,
        file
      )).validate;
    });

  Object.keys(models).forEach((modelName) => {
    if (typeof models[modelName].associate == "function") {
      models[modelName].associate(models);
    }
  });

  SequelizeDB.addHook("afterValidate", function (instance, options) {
    const changedKeys = [];

    Object.keys(instance._changed).forEach(function (fieldName) {
      if (instance._changed[fieldName]) {
        changedKeys.push(fieldName);
      }
    });

    if (!changedKeys.length) {
      return;
    }

    debug(`Changed attributes: ${changedKeys}`);

    const modelName = instance.constructor.name;

    const validationErrors = [];

    changedKeys.forEach(function (fieldName) {
      const fieldDefinition = instance.rawAttributes[fieldName];

      // If no such attribute (virtual field), or no schema specified for this attribute
      if (!fieldDefinition || !fieldDefinition["schema"]) {
        return;
      }

      debug(`Validation schema for attribute: ${fieldName}`);

      const schema = fieldDefinition["schema"];
      const value = instance[fieldName];

      const validation = Joi.validate(value, schema, {
        abortEarly: false,
        allowUnknown: false,
        noDefaults: false,
        escapeHtml: true,
      });

      if (validation.error) {
        validation.error.details.forEach(function (joiValidationError) {
          // const errorMessageSegments = joiValidationError.message.split("\"")
          const errorPath = `${fieldName}.${joiValidationError.path.join(".")}`;
          const errorMessage = joiValidationError.message; //`${modelName}.${errorPath}${errorMessageSegments[2]}`
          const errorType = "invalid schema";
          const errorValue = getProperty(value, joiValidationError.path);
          const error = new SequelizeDB.ValidationErrorItem(
            errorMessage,
            errorType,
            errorPath,
            errorValue,
            instance
          );
          validationErrors.push(error);
        });
      }

      instance[fieldName] = validation.value;
    });

    if (validationErrors.length) {
      return SequelizeDB.Promise.try(function () {
        throw new SequelizeDB.ValidationError(null, validationErrors);
      });
    }
  });

  models.SequelizeDB = SequelizeDB;

  models.Sequelize = sequelize;

  models.Op = sequelize.Op;

  if (appConfig.DB["SYNC"]) {
    models.SequelizeDB.sync({
      force: appConfig.DB.SYNC_FORCE,
      alter: appConfig.DB.ALTER,
    }).then(async () => {});
  }

  return models;
};
