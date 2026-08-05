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
  upload.single("menuImage"),
  createMenu,
);

menuRouter.get(
  "/my/:restaurantID/menu",
  isAuthenticated,
  allowRoles(["restaurant"]),
  getMyMenu,
);

menuRouter.get(
  "/my/:restaurantID/menu/:menuID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  getMyMenuById,
);

menuRouter.put(
  "/:restaurantID/menu/:menuID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  upload.single("menuImage"),
  updateMenu,
);

menuRouter.delete(
  "/:restaurantID/menu/:menuID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  deleteMenu,
);

module.exports = menuRouter;
