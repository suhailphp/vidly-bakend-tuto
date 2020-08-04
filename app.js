"use strict";

/**
 *
 *  Created By Suhail 16/04/2020
 *
 */

const fs = require("fs");
const path = require("path");

const express = require("express");

const appConfig = require("./src/configurations/appConfig.js");

const bodyParser = require("body-parser");
const methodOverride = require("method-override");
var parseForm = bodyParser.urlencoded({ extended: false });
const app = express();
const ENV = appConfig.ENV;
// jwt
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(parseForm);
app.use(bodyParser.json({ type: "application/json", limit: "50mb" }));
// Add headers
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  // res.header("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});
app.set("port", appConfig.PORT);

const Models = require("./src/models/")();

/**
 *
 *  Routes Init
 *
 */

fs.readdirSync(__dirname + "/src/controllers").forEach(function (file) {
  if (file.substr(-3) == ".js") {
    app.use(
      file.replace(".js", "") === "index"
        ? "/"
        : path.join("/", file.replace(".js", "")),
      require(__dirname + "/src/controllers/" + file)(
        express.Router().use(function (req, res, next) {
          const _render = res.render;
          res.render = function (view, options, fn) {
            let newView =
              file.replace(".js", "") === "index"
                ? view
                : file.replace(".js", "") + "/" + view;
            if (view.indexOf("error") > -1) newView = "error";
            // debug('view', view, 'file', file, 'newView', newView)
            _render.call(this, newView, options, fn);
          };
          next();
        }),
        Models
      )
    );
  }
});

module.exports = app;
