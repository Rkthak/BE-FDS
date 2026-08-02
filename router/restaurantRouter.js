const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const {
  createRestaurant,
  getRestaurants,
  getRestaurantsByID,
} = require("../controller/restaurantController");

const restaurantRouter = express.Router();

restaurantRouter.post("/", isAuthenticated, createRestaurant);
restaurantRouter.get("/", getRestaurants);
restaurantRouter.get("/:slugID", getRestaurantsByID);

module.exports = restaurantRouter;
