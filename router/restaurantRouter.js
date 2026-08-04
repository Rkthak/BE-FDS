const express = require("express");
const { isAuthenticated, allowRoles } = require("../middleware/auth");
const {
  createRestaurant,
  getRestaurants,
  getRestaurantsByID,
  getMyRestaurant,
  deleteMyRestaurant,
  updateMyRestaurant,
} = require("../controller/restaurantController");

const restaurantRouter = express.Router();

// authenticated only route
restaurantRouter.post(
  "/",
  isAuthenticated,
  allowRoles(["user", "restaurant"]),
  createRestaurant,
);
restaurantRouter.get("/my", isAuthenticated, getMyRestaurant);
restaurantRouter.delete("/my/:slugID", isAuthenticated, deleteMyRestaurant);
restaurantRouter.put("/my/:slugID", isAuthenticated, updateMyRestaurant);

// public routes
restaurantRouter.get("/", getRestaurants);
restaurantRouter.get("/:slugID", getRestaurantsByID);

//  protected routes

module.exports = restaurantRouter;
