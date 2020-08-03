"use strict";

const appConfig = require("../configurations/appConfig.js");

module.exports = (Router, Models) => {
  // options are csrfProtection, parseForm

  Router.get("/", async (req, res, next) => {
    let Genre = await Models.Genre.findAll();
    console.log(Genre);
    res.send("hello");
  });

  return Router;
};
