const express = require("express");
const { isAuthenticated } = require("../middleware/auth");

const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require("../controller/orderController");

const orderRouter = express.Router();

// Place order
orderRouter.post("/", isAuthenticated, placeOrder);

// Get my orders
orderRouter.get("/my", isAuthenticated, getMyOrders);

// Get single order
orderRouter.get("/:orderID", isAuthenticated, getOrderById);

// Cancel order
orderRouter.patch("/:orderID/cancel", isAuthenticated, cancelOrder);

module.exports = orderRouter;
