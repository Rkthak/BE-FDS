const express = require("express");
const { isAuthenticated, allowRoles } = require("../middleware/auth");

const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getRestaurantOrders,
  updateOrderStatus,
  getRestaurantOrderById,
} = require("../controller/orderController");
const isApprovedRestaurant = require("../middleware/isApprovedRestaurant");

const orderRouter = express.Router();

orderRouter.get(
  "/restaurant",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  getRestaurantOrders,
);

orderRouter.get(
  "/restaurant/:orderID",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  getRestaurantOrderById,
);

orderRouter.patch(
  "/restaurant/:orderID/status",
  isAuthenticated,
  allowRoles(["restaurant"]),
  isApprovedRestaurant,
  updateOrderStatus,
);

orderRouter.post("/", isAuthenticated, placeOrder);

orderRouter.get("/my", isAuthenticated, getMyOrders);

orderRouter.get("/:orderID", isAuthenticated, getOrderById);

orderRouter.patch("/:orderID/cancel", isAuthenticated, cancelOrder);

module.exports = orderRouter;
