"use strict";

const appConfig = require("../configurations/appConfig.js");

const moduleName = i18n.__("Category");
const base_url = "/category/";

//for side bar activate class
let currentPage = "Category";
let mainPage = "Pharmacy";

module.exports = (Router, Models) => {
  // options are csrfProtection, parseForm

  Router.get("/", async (req, res, next) => {
    res.send("hello");
  });

  return Router;
};
