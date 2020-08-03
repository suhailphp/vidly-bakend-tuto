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

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(parseForm);
app.use(bodyParser.json({ type: "application/json", limit: "50mb" }));

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
