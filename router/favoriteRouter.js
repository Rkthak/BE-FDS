const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const {
  getFavoriteRestaurants,
  updateFavoriteRestaurant,
  updateFavoriteMenu,
  getFavoriteMenus,
} = require("../controller/favoriteController");

const favoriteRouter = express.Router();

// Restaurant Favorites
favoriteRouter.patch(
  "/restaurant/:restaurantID",
  isAuthenticated,
  updateFavoriteRestaurant,
);

favoriteRouter.get("/restaurant", isAuthenticated, getFavoriteRestaurants);

favoriteRouter.patch("/menu/:menuID", isAuthenticated, updateFavoriteMenu);
favoriteRouter.get("/menu/", isAuthenticated, getFavoriteMenus);

module.exports = favoriteRouter;
