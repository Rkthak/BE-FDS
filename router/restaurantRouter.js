const express = require("express");
const { isAuthenticated, allowRoles } = require("../middleware/auth");
const {
  createRestaurant,
  getRestaurants,
  getRestaurantsByID,
  getMyRestaurant,
  deleteMyRestaurant,
  updateMyRestaurant,
  uploadLogo,
  uploadBanner,
  getMyRestaurantByID,
  searchRestaurantByFilters,
  getMyRestaurantApplication,
  updateMyRestaurantApplication,
} = require("../controller/restaurantController");
const upload = require("../middleware/uploadImage");
const isMyRestaurant = require("../middleware/isMyRestaurant");

const restaurantRouter = express.Router();

// authenticated only route
restaurantRouter.post(
  "/",
  isAuthenticated,
  allowRoles(["user", "restaurant"]),
  upload.fields([
    {
      name: "restaurantLogo",
      maxCount: 1,
    },
    {
      name: "restaurantBanner",
      maxCount: 1,
    },
  ]),
  createRestaurant,
);
restaurantRouter.get(
  "/my-application",
  isAuthenticated,
  getMyRestaurantApplication,
);
restaurantRouter.put(
  "/my-application",
  isAuthenticated,
  upload.fields([
    {
      name: "restaurantLogo",
      maxCount: 1,
    },
    {
      name: "restaurantBanner",
      maxCount: 1,
    },
  ]),
  updateMyRestaurantApplication,
);
restaurantRouter.get("/my", isAuthenticated, getMyRestaurant);
restaurantRouter.get(
  "/my/:slugID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isMyRestaurant,
  getMyRestaurantByID,
);
restaurantRouter.delete(
  "/my/:slugID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  deleteMyRestaurant,
);
restaurantRouter.put(
  "/my/:slugID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isMyRestaurant,
  updateMyRestaurant,
);
restaurantRouter.put(
  "/my/:slugID/upload-logo",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isMyRestaurant,
  upload.single("restaurantLogo"),
  uploadLogo,
);
restaurantRouter.put(
  "/my/:slugID/upload-banner",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isMyRestaurant,
  upload.single("restaurantBanner"),
  uploadBanner,
);

// public routes
restaurantRouter.get("/", getRestaurants);
restaurantRouter.get("/search", searchRestaurantByFilters);
restaurantRouter.get("/:slugID", getRestaurantsByID);

module.exports = restaurantRouter;
