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

  Router.post("/", async (req, res, next) => {
    await Models.Genre.create({ name: req.body.name }, { validate: true })
      .then(async function (resData) {
        res.send(resData);
      })
      .catch(async (error) => {
        res.status(400).send(error.message);
      });
  });

  Router.put("/:id", async (req, res) => {
    const genre = await Models.Genre.findOne({
      where: { genreID: req.params.id },
    });

    if (genre) {
      genre.name = req.body.name;
      genre
        .save()
        .then((resData) => {
          res.send(genre);
        })
        .catch((error) => {
          return res.status(404).send(error.message);
        });
    } else {
      return res.status(404).send("The genre with the given ID was not found.");
    }
  });

  return Router;
};
