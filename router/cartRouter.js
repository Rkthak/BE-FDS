const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controller/cartController");

const cartRouter = express.Router();

/* ---------------- User Cart Routes ---------------- */

// Add item to cart
cartRouter.post("/", isAuthenticated, addToCart);

// Get user's cart
cartRouter.get("/", isAuthenticated, getCart);

// Update item quantity
cartRouter.put("/", isAuthenticated, updateCartItem);

// Remove item from cart
cartRouter.delete("/item", isAuthenticated, removeCartItem);

// Clear cart
cartRouter.delete("/", isAuthenticated, clearCart);

module.exports = cartRouter;
