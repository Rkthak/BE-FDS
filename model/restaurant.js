const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      default: "India",
      trim: true,
    },
  },
  { _id: false },
);

const restaurantSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },

    restaurantName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    logo: {
      type: String,
      default: "",
    },

    banner: {
      type: String,
      default: "",
    },

    cuisine: [
      {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: (value) => value.length > 0,
          message: "At least one cuisine is required",
        },
      },
    ],

    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    address: {
      type: addressSchema,
      required: true,
    },

    openingHours: {
      open: {
        type: String,
        required: true,
      },

      close: {
        type: String,
        required: true,
      },
    },

    deliveryTime: {
      type: Number,
      min: 10,
    },

    deliveryFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    minimumOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isOpen: {
      type: Boolean,
      default: true,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Restaurant = mongoose.model(
  "Restaurant",
  restaurantSchema,
  "restaurants",
);

module.exports = Restaurant;
