const express = require("express");
const { isAuthenticated, allowRoles } = require("../middleware/auth");
const upload = require("../middleware/uploadImage");

// const { createMenu } = require("../controller/menuController");

// const menuRouter = express.Router();

// module.exports = menuRouter;

const {
  createMenu,
  getRestaurantMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
  getMyMenu,
  getMyMenuById,
} = require("../controller/menuController");
const isApprovedRestaurant = require("../middleware/isApprovedRestaurant");

const menuRouter = express.Router();

/* ----------------------- Public Routes ----------------------- */

// Get all menus of a restaurant
menuRouter.get("/:restaurantID/menu", getRestaurantMenus);

// Get single menu of a restaurant
menuRouter.get("/:restaurantID/menu/:menuID", getMenuById);

/* ---------------- Restaurant Owner Routes ---------------- */

menuRouter.post(
  "/:restaurantID/menu",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  upload.single("menuImage"),
  createMenu,
);

menuRouter.get(
  "/my/:restaurantID/menu",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  getMyMenu,
);

menuRouter.get(
  "/my/:restaurantID/menu/:menuID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  getMyMenuById,
);

menuRouter.put(
  "/:restaurantID/menu/:menuID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  upload.single("menuImage"),
  updateMenu,
);

menuRouter.delete(
  "/:restaurantID/menu/:menuID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  deleteMenu,
);

module.exports = menuRouter;
