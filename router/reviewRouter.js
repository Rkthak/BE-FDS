const express = require("express");
const { isAuthenticated, allowRoles } = require("../middleware/auth");
const {
  createReview,
  getMyReviews,
  updateMyReview,
  deleteMyReview,
  getRestaurantReviews,
  respondToReview,
} = require("../controller/reviewController");

const reviewRouter = express.Router();

// ==================== USER ====================

// Create review
reviewRouter.post(
  "/:slug",
  isAuthenticated,
  allowRoles(["user"]),
  createReview,
);

// Get my reviews
reviewRouter.get("/my", isAuthenticated, allowRoles(["user"]), getMyReviews);

// Update my review
reviewRouter.patch(
  "/my/:slug",
  isAuthenticated,
  allowRoles(["user"]),
  updateMyReview,
);

// Delete my review
reviewRouter.delete(
  "/my/:slug",
  isAuthenticated,
  allowRoles(["user"]),
  deleteMyReview,
);

// ==================== PUBLIC ====================

// Get restaurant reviews
reviewRouter.get("/restaurant/:slug", getRestaurantReviews);

// ==================== RESTAURANT ====================

// Respond to review
reviewRouter.patch(
  "/restaurant/:reviewId/respond",
  isAuthenticated,
  allowRoles(["restaurant"]),
  respondToReview,
);

module.exports = reviewRouter;
