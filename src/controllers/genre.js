"use strict";

const appConfig = require("../configurations/appConfig.js");

const express = require("express");
const router = express.Router();

module.exports = (Router, Models) => {
  // options are csrfProtection, parseForm

  Router.get("/", async (req, res, next) => {
    console.log(Models.Genre);
    let Genre = await Models.Genre.findAll();
    res.send(Genre);
  });

  Router.post("/", async (req, res) => {
    console.log(JSON.stringify(req.body));
    res.send(req.body);
  });

  return Router;
};
