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
    // models.SequelizeDB.sync({force: appConfig.DB.SYNC_FORCE, alter: appConfig.DB.ALTER}).then(async () => {
    //     const [UserResp, created] = await models
    //         .User
    //         .findOrCreate({
    //             where: {
    //                 UserName: 'suhail',
    //             },
    //             defaults: {
    //                 FullNameEn: 'Suhail Malayantavida',
    //                 FullNameAr: 'سهيل مالايانتافيدا كونها عبدالله',
    //                 UserName: 'suhail',
    //                 Password: "7c337c005fd861d11d45cef7d7e00bc7d4e29f5b2932ea7f7e9cfe9c061944b6eb3027de0c7c77beb82b7919f9137f671a8e499812c76546c9b3085eb4325169",
    //                 PasswordSalt: "a355fa04b0ddeaa6bcb1f8c2d9517049",
    //                 UserCreatedUserName: 'suhail',
    //                 UserType: 'ADMIN',
    //                 Email: 'suhail@psa.ac.ae',
    //                 IsManager: true,
    //                 Active: true,
    //                 ADLogin:false,
    //             }
    //         })
    //     if (created)
    //         debug('Default User Created, User: suhail')
    // });
  }

  return models;
};

function getProperty(source, path) {
  const next = path.shift();
  if (typeof next === "undefined") {
    return source;
  }
  if (typeof source[next] === "undefined") {
    if (path.length === 0) {
      return source[next];
    }
    throw new Error("Invalid path");
  }
  return getProperty(source[next], path);
}
