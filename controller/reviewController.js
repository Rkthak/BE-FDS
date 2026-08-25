const Restaurant = require("../model/restaurant");
const Review = require("../model/review");

const reviewController = {
  // ==================== USER ====================

  // Create review
  createReview: async (request, response) => {
    try {
      const { slug } = request.params;
      const { restaurantRating, deliveryRating, comment } = request.body;

      const restaurant = await Restaurant.findOne({ slug });

      if (!restaurant) {
        return response.status(404).json({
          message: "Restaurant not found",
        });
      }

      const existingReview = await Review.findOne({
        userId: request.user._id,
        restaurantId: restaurant._id,
      });

      if (existingReview) {
        return response.status(400).json({
          message: "You have already reviewed this restaurant",
        });
      }

      const review = await Review.create({
        userId: request.user._id,
        restaurantId: restaurant._id,
        restaurantRating,
        deliveryRating,
        comment,
        status: "pending",
        moderationNote: null,
      });

      await reviewController.updateRestaurantRating(restaurant._id);

      return response.status(201).json({
        message: "Review submitted successfully and is awaiting admin approval",
        review,
      });
    } catch (error) {
      return response.status(500).json({
        message: "Failed to add review",
      });
    }
  },

  // Get my reviews
  getMyReviews: async (request, response) => {
    try {
      const reviews = await Review.find({
        userId: request.user._id,
      })
        .populate("restaurantId")
        .sort({ createdAt: -1 });

      return response.status(200).json({
        reviews,
      });
    } catch (error) {
      return response.status(500).json({
        message: "Failed to get your reviews",
      });
    }
  },

  // Update my review
  updateMyReview: async (request, response) => {
    try {
      const { slug } = request.params;
      const { restaurantRating, deliveryRating, comment } = request.body;

      const restaurant = await Restaurant.findOne({ slug });

      if (!restaurant) {
        return response.status(404).json({
          message: "Restaurant not found",
        });
      }

      const review = await Review.findOne({
        userId: request.user._id,
        restaurantId: restaurant._id,
      });

      if (!review) {
        return response.status(404).json({
          message: "Review not found",
        });
      }

      // Update review content
      review.restaurantRating = restaurantRating;
      review.deliveryRating = deliveryRating;
      review.comment = comment;
      review.status = "pending";

      // Remove old rejection reason because
      // the user has submitted an updated version.
      review.moderationNote = null;

      // Old restaurant response should no longer be
      // considered valid for the newly edited review.
      review.restaurantResponse = null;
      review.respondedAt = null;

      await review.save();

      // Only approved reviews affect restaurant rating.
      await reviewController.updateRestaurantRating(restaurant._id);

      return response.status(200).json({
        message: "Review updated successfully and submitted for admin approval",
        review,
      });
    } catch (error) {
      return response.status(500).json({
        message: "Failed to update review",
      });
    }
  },

  // Delete my review
  deleteMyReview: async (request, response) => {
    try {
      const { slug } = request.params;

      const restaurant = await Restaurant.findOne({ slug });

      if (!restaurant) {
        return response.status(404).json({
          message: "Restaurant not found",
        });
      }

      const review = await Review.findOne({
        userId: request.user._id,
        restaurantId: restaurant._id,
      });

      if (!review) {
        return response.status(404).json({
          message: "Review not found",
        });
      }

      await review.deleteOne();

      await reviewController.updateRestaurantRating(restaurant._id);

      return response.status(200).json({
        message: "Review deleted successfully",
      });
    } catch (error) {
      return response.status(500).json({
        message: "Failed to delete review",
      });
    }
  },

  // ==================== PUBLIC ====================

  // Get restaurant reviews
  getRestaurantReviews: async (request, response) => {
    try {
      const { slug } = request.params;

      const restaurant = await Restaurant.findOne({ slug });

      if (!restaurant) {
        return response.status(404).json({
          message: "Restaurant not found",
        });
      }

      // Only approved reviews are visible publicly.
      const reviews = await Review.find({
        restaurantId: restaurant._id,
        status: "approved",
      })
        .populate("userId", "userName email")
        .sort({ createdAt: -1 });

      return response.status(200).json({
        reviews,
      });
    } catch (error) {
      return response.status(500).json({
        message: "Failed to get restaurant reviews",
      });
    }
  },

  // ==================== ADMIN ====================

  // Get all reviews
  getAllReviews: async (request, response) => {
    try {
      // Admin can see pending, approved and rejected reviews.
      const reviews = await Review.find()
        .populate("userId", "userName email")
        .populate("restaurantId")
        .sort({ createdAt: -1 });

      return response.status(200).json({
        reviews,
      });
    } catch (error) {
      return response.status(500).json({
        message: "Failed to get reviews",
      });
    }
  },

  // Approve / reject review
  moderateReview: async (request, response) => {
    try {
      const { reviewId } = request.params;
      const { status, moderationNote } = request.body;

      if (!["approved", "rejected"].includes(status)) {
        return response.status(400).json({
          message: "Invalid review status",
        });
      }

      const review = await Review.findById(reviewId);

      if (!review) {
        return response.status(404).json({
          message: "Review not found",
        });
      }

      review.status = status;

      if (status === "rejected") {
        review.moderationNote =
          moderationNote?.trim() ||
          "This review has been rejected because it does not meet our community guidelines.";
      } else {
        // If admin approves the review, rejection reason is removed.
        review.moderationNote = null;
      }

      await review.save();

      // Recalculate restaurant rating.
      // Only approved reviews are included.
      await reviewController.updateRestaurantRating(review.restaurantId);

      return response.status(200).json({
        message:
          status === "approved"
            ? "Review approved successfully"
            : "Review rejected successfully",
        review,
      });
    } catch (error) {
      return response.status(500).json({
        message: "Failed to moderate review",
      });
    }
  },

  // ==================== RESTAURANT ====================
  // Respond to review

  respondToReview: async (request, response) => {
    try {
      const { reviewId } = request.params;
      const { restaurantResponse } = request.body;

      const review = await Review.findById(reviewId);

      if (!review) {
        return response.status(404).json({
          message: "Review not found",
        });
      }

      const restaurant = await Restaurant.findOne({
        _id: review.restaurantId,
        ownerId: request.user._id,
      });

      if (!restaurant) {
        return response.status(403).json({
          message: "You are not authorized to respond to this review",
        });
      }

      review.restaurantResponse = restaurantResponse;
      review.respondedAt = new Date();

      await review.save();

      // Save ke baad user aur restaurant ko dobara populate karo
      await review.populate([
        {
          path: "userId",
          select: "userName email",
        },
        {
          path: "restaurantId",
        },
      ]);

      return response.status(200).json({
        message: "Response added successfully",
        review,
      });
    } catch (error) {
      return response.status(500).json({
        message: "Failed to respond to review",
      });
    }
  },

  // ==================== HELPER ====================

  updateRestaurantRating: async (restaurantId) => {
    const result = await Review.aggregate([
      {
        $match: {
          restaurantId: restaurantId,
          status: "approved",
        },
      },
      {
        $group: {
          _id: "$restaurantId",

          averageRating: {
            $avg: "$restaurantRating",
          },

          totalReviews: {
            $sum: 1,
          },
        },
      },
    ]);

    if (result.length === 0) {
      await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: 0,
        totalReviews: 0,
      });

      return;
    }

    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: Number(result[0].averageRating.toFixed(1)),
      totalReviews: result[0].totalReviews,
    });
  },
};

module.exports = reviewController;
