const express = require("express");
const { isAuthenticated, allowRoles } = require("../middleware/auth");
const upload = require("../middleware/uploadImage");

// const { createMenu } = require("../controller/menuController");

// const menuRouter = express.Router();

// module.exports = menuRouter;

const {
  createMenu,
  getRestaurantMenus,
  updateMenu,
  deleteMenu,
  getMyMenu,
  getMyMenuById,
  getAllMenus,
  getRestaurantMenuById,
  getMenuById,
} = require("../controller/menuController");
const isApprovedRestaurant = require("../middleware/isApprovedRestaurant");

const menuRouter = express.Router();

/* ----------------------- Public Routes ----------------------- */
// Get all menus
menuRouter.get("/", getAllMenus);
menuRouter.get("/:menuID", getMenuById);

// Get all menus of a restaurant
menuRouter.get("/restaurant/:restaurantID", getRestaurantMenus);

// Get single menu of a restaurant
menuRouter.get("/restaurant/:restaurantID/:menuID", getRestaurantMenuById);

/* ---------------- Restaurant Owner Routes ---------------- */

menuRouter.post(
  "/my",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  upload.single("menuImage"),
  createMenu,
);

menuRouter.get(
  "/my",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  getMyMenu,
);

menuRouter.get(
  "/my/:menuID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  getMyMenuById,
);

menuRouter.put(
  "/my/:menuID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  upload.single("menuImage"),
  updateMenu,
);

menuRouter.delete(
  "/my/:menuID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  deleteMenu,
);

module.exports = menuRouter;
