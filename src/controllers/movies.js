"use strict";

const appConfig = require("../configurations/appConfig.js");

const { apiAuthentication, isAdmin } = require("../middlewares/gatekeeper");

const express = require("express");
const router = express.Router();

module.exports = (Router, Models) => {
  // options are csrfProtection, parseForm

  Router.get("/", [], async (req, res, next) => {
    let Movie = await Models.Movie.findAll({
      include: [
        {
          model: Models.Genre,
          as: "Genre",
        },
      ],
    });
    res.send(Movie);
  });

  Router.post("/", apiAuthentication, async (req, res, next) => {
    let data = {
      title: req.body.title,
      genreID: req.body.genreID,
      numberInStock: req.body.numberInStock,
      dailyRentalRate: req.body.dailyRentalRate,
    };

    await Models.Movie.create(data, { validate: true })
      .then(async function (resData) {
        res.send(resData);
      })
      .catch(async (error) => {
        res.status(400).send(error.message);
      });
  });

  Router.put("/:id", apiAuthentication, async (req, res) => {
    const Movie = await Models.Movie.findOne({
      where: { MovieID: req.params.id },
    });

    if (Movie) {
      Movie.title = req.body.title;
      Movie.genreID = req.body.genreID;
      Movie.numberInStock = req.body.numberInStock;
      Movie.dailyRentalRate = req.body.dailyRentalRate;
      Movie.save()
        .then(() => {
          res.send(Movie);
        })
        .catch((error) => {
          return res.status(404).send(error.message);
        });
    } else {
      return res.status(404).send("The Movie with the given ID was not found.");
    }
  });

  Router.delete("/:id", [apiAuthentication, isAdmin], async (req, res) => {
    const Movie = await Models.Movie.findOne({
      where: { MovieID: req.params.id },
    });

    if (Movie) {
      Movie.destroy()
        .then(() => {
          res.send(Movie);
        })
        .catch((error) => {
          return res.status(404).send(error.message);
        });
    } else {
      return res.status(404).send("The Movie with the given ID was not found.");
    }
  });

  Router.get("/:id", apiAuthentication, async (req, res) => {
    const Movie = await Models.Movie.findOne({
      where: { MovieID: req.params.id },
    });

    if (!Movie)
      return res.status(404).send("The Movie with the given ID was not found.");

    res.send(Movie);
  });

  return Router;
};
