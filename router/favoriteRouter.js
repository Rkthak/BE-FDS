const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const {
  getFavoriteRestaurants,
  updateFavoriteRestaurant,
} = require("../controller/favoriteController");

const favoriteRouter = express.Router();

// Restaurant Favorites
favoriteRouter.patch(
  "/restaurant/:restaurantID",
  isAuthenticated,
  updateFavoriteRestaurant,
);

favoriteRouter.get("/restaurant", isAuthenticated, getFavoriteRestaurants);

module.exports = favoriteRouter;
