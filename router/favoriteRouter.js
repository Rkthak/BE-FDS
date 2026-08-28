const express = require("express");
const { isAuthenticated, allowRoles } = require("../middleware/auth");
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
  allowRoles(["user"]),
  updateFavoriteRestaurant,
);

favoriteRouter.get(
  "/restaurant",
  isAuthenticated,
  allowRoles(["user"]),
  getFavoriteRestaurants,
);

favoriteRouter.patch(
  "/menu/:menuID",
  isAuthenticated,
  allowRoles(["user"]),
  updateFavoriteMenu,
);
favoriteRouter.get(
  "/menu/",
  isAuthenticated,
  allowRoles(["user"]),
  getFavoriteMenus,
);

module.exports = favoriteRouter;
