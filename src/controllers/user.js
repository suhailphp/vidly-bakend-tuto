"use strict";

const appConfig = require("../configurations/appConfig.js");

const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");

module.exports = (Router, Models) => {
  // options are csrfProtection, parseForm

  Router.get("/", async (req, res, next) => {
    let Users = await Models.User.findAll();
    res.send(Users);
  });

  Router.post("/", async (req, res, next) => {
    let User = await Models.User.findOne({ where: { email: req.body.email } });

    if (User && User.email === req.body.email) {
      return res.status(400).send("User Already exists");
    }

    await Models.User.create(
      {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      },
      { validate: true }
    )
      .then(async function (resData) {
        res.send(resData);
      })
      .catch(async (error) => {
        res.status(400).send(error.message);
      });
  });

  Router.put("/:id", async (req, res) => {
    const user = await Models.User.findOne({
      where: { UserID: req.params.id },
    });

    if (user) {
      user.name = req.body.name;
      user
        .save()
        .then((resData) => {
          res.send(user);
        })
        .catch((error) => {
          return res.status(404).send(error.message);
        });
    } else {
      return res.status(404).send("User not found.");
    }
  });

  Router.delete("/:id", async (req, res) => {
    const user = await Models.User.findOne({
      where: { UserID: req.params.id },
    });

    if (genre) {
      user
        .destroy()
        .then(() => {
          res.send(user);
        })
        .catch((error) => {
          return res.status(404).send(error.message);
        });
    } else {
      return res.status(404).send("User was not found.");
    }
  });

  Router.get("/:id", async (req, res) => {
    const user = await Models.User.findOne({
      where: { UserID: req.params.id },
    });

    if (!user)
      return res.status(404).send("The user with the given ID was not found.");

    res.send(user);
  });

  Router.post("/auth", async (req, res) => {
    const user = await Models.User.findOne({
      where: { email: req.body.email, password: req.body.password },
    });

    if (!user)
      return res.status(404).send("Password or Username is not matching");

    const token = jwt.sign(
      {
        UserID: user.UserID,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      appConfig.JWT_PRIVATE_KEY
    );

    res.send(token);
  });

  return Router;
};
