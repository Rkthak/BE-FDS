const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    items: [itemSchema],

    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
