"use strict";
const appConfig = require("../configurations/appConfig");

const jwt = require("jsonwebtoken");

module.exports.apiAuthentication = function (req, res, next) {
  if (!appConfig.REQUIRE_AUTH) return next();

  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, appConfig.JWT_PRIVATE_KEY);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
};

module.exports.isAdmin = function (req, res, next) {
  if (!appConfig.REQUIRE_AUTH) return next();
  if (req.user && req.user.isAdmin) {
    return next();
  } else {
    res.status(403).send("You don't have permission.");
  }
};
