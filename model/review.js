const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // Customer who wrote the review
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Restaurant being reviewed
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    // Restaurant rating
    restaurantRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Delivery experience rating
    deliveryRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Customer's review
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 1000,
    },

    // Review moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Admin's moderation note
    moderationNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    // Restaurant owner's response
    restaurantResponse: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    // When restaurant responded
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index(
  {
    userId: 1,
    restaurantId: 1,
  },
  {
    unique: true,
  },
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
