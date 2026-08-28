const express = require("express");
const { isAuthenticated, allowRoles } = require("../middleware/auth");
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
cartRouter.post("/", isAuthenticated, allowRoles(["user"]), addToCart);

// Get user's cart
cartRouter.get("/", isAuthenticated, allowRoles(["user"]), getCart);

// Update item quantity
cartRouter.put(
  "/item/:menuID",
  isAuthenticated,
  allowRoles(["user"]),
  updateCartItem,
);

// Remove item from cart
cartRouter.delete(
  "/item/:menuID",
  isAuthenticated,
  allowRoles(["user"]),
  removeCartItem,
);

// Clear cart
cartRouter.delete("/clear", isAuthenticated, allowRoles(["user"]), clearCart);

module.exports = cartRouter;
