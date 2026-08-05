const mongoose = require("mongoose");

const customizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    extraPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

const nutritionSchema = new mongoose.Schema(
  {
    calories: {
      type: Number,
      min: 0,
    },

    protein: {
      type: Number,
      min: 0,
    },

    carbs: {
      type: Number,
      min: 0,
    },

    fat: {
      type: Number,
      min: 0,
    },
  },
  { _id: false },
);

const menuSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    image: {
      type: String,
      default: "",
      require: true,
    },

    isVeg: {
      type: Boolean,
      default: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    nutrition: {
      type: nutritionSchema,
      default: {},
    },

    customizations: {
      type: [customizationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;
