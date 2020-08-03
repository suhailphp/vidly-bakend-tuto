"use strict";

const moduleName = "Home";

module.exports = (router, Models) => {
  router.all("/", async (req, res, next) => {
    res.send("hello");
  });

  return router;
};
