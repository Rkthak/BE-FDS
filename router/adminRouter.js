const express = require("express");
const { isAuthenticated, allowRoles } = require("../middleware/auth");
const {
  getRestaurants,
  getRestaurantsByID,
  approveRestaurant,
  deleteRestaurant,
  updateRestaurant,
} = require("../controller/adminController");

const adminRouter = express.Router();

adminRouter.use(isAuthenticated);
adminRouter.use(allowRoles(["admin"]));

// protected route
adminRouter.get("/restaurant", getRestaurants);
adminRouter.get("/restaurant/:restaurantID", getRestaurantsByID);
adminRouter.delete("/restaurant/:restaurantID", deleteRestaurant);
adminRouter.put("/restaurant/:restaurantID", updateRestaurant);
adminRouter.patch("/restaurant/:restaurantID/status", approveRestaurant);

module.exports = adminRouter;
