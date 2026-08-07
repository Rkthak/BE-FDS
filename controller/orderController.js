const mongoose = require("mongoose");
const Cart = require("../model/cart");
const Menu = require("../model/menu");
const Order = require("../model/order");
const User = require("../model/user");

const orderController = {
  placeOrder: async (request, response) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const userID = request.userID;

      const user = await User.findById(userID).session(session);

      if (!user) {
        await session.abortTransaction();
        return response.status(400).json({ message: "user not found" });
      }

      if (!user.addresses) {
        await session.abortTransaction();
        return response
          .status(400)
          .json({ message: "please provide a valid address for dilivery" });
      }

      const cart = await Cart.findOne({ userId: userID })
        .populate("items.menuId")
        .session(session);

      if (!cart) {
        await session.abortTransaction();
        return response
          .status(400)
          .json({ message: "please add item in cart for placing order" });
      }

      if (cart.items.length === 0) {
        await session.abortTransaction();
        return response.status(400).json({
          message: "Cart is empty.",
        });
      }

      for (const item of cart.items) {
        const menu = item.menuId;

        if (!menu) {
          await session.abortTransaction();
          return response
            .status(400)
            .json({ message: "may be the dish is deleted" });
        }

        if (!menu.isAvailable) {
          await session.abortTransaction();
          return response
            .status(400)
            .json({ message: "dish is not available" });
        }
      }

      const newOrder = new Order({
        userId: user._id,
        restaurantId: cart.restaurantId,

        items: cart.items.map((item) => ({
          menuId: item.menuId._id,
          itemName: item.menuId.itemName,
          price: item.menuId.price,
          quantity: item.quantity,
        })),

        totalAmount: cart.totalAmount,

        deliveryAddress: user.addresses,

        paymentMethod: "COD",
        paymentStatus: "pending",

        orderStatus: "pending",
      });

      await newOrder.save({ session });

      await cart.deleteOne({ session });

      user.orders.push(newOrder._id);
      await user.save({ session });

      await session.commitTransaction();

      response.status(201).json({
        message: "Order placed successfully.",
      });
    } catch (error) {
      await session.abortTransaction();
      response.status(500).json({
        message: "Error placing order.",
        err: error.message,
      });
    } finally {
      session.endSession();
    }
  },
  getMyOrders: async (request, response) => {
    try {
      const userID = request.userID;

      const orders = await Order.find({
        userId: userID,
      })
        .populate("restaurantId", "restaurantName")
        .sort({ createdAt: -1 });

      if (orders.length === 0) {
        return response.status(404).json({
          message: "no orders found.",
        });
      }

      response.status(200).json({
        message: "orders fetched successfully.",
        orders,
      });
    } catch (error) {
      response.status(500).json({
        message: "error getting orders.",
        err: error.message,
      });
    }
  },
  getOrderById: async (request, response) => {
    try {
      const { orderID } = request.params;
      const userID = request.userID;

      const order = await Order.findOne({
        _id: orderID,
        userId: userID,
      }).populate("restaurantId", "restaurantName");

      if (!order) {
        return response.status(404).json({
          message: "order not found.",
        });
      }

      response.status(200).json({
        message: "order fetched successfully.",
        order,
      });
    } catch (error) {
      response.status(500).json({
        message: "error getting order.",
        err: error.message,
      });
    }
  },
  cancelOrder: async (request, response) => {
    try {
      const { orderID } = request.params;
      const userID = request.userID;

      const order = await Order.findOne({
        _id: orderID,
        userId: userID,
      });

      if (!order) {
        return response.status(404).json({
          message: "order not found.",
        });
      }

      if (order.orderStatus !== "pending") {
        return response.status(400).json({
          message: "order cannot be cancelled now.",
        });
      }

      order.orderStatus = "cancelled";

      await order.save();

      response.status(200).json({
        message: "order cancelled successfully.",
      });
    } catch (error) {
      response.status(500).json({
        message: "error cancelling order.",
        err: error.message,
      });
    }
  },
  getRestaurantOrders: async (request, response) => {
    try {
      const restaurantID = request.restaurantID;
      console.log(restaurantID);

      const orders = await Order.find({
        restaurantId: restaurantID,
      })
        .populate("userId", "userName phoneNumber")
        .sort({ createdAt: -1 });

      if (orders.length === 0) {
        return response.status(404).json({
          message: "no orders found.",
        });
      }

      response.status(200).json({
        message: "restaurant orders fetched successfully.",
        orders,
      });
    } catch (error) {
      response.status(500).json({
        message: "error getting restaurant orders.",
        err: error.message,
      });
    }
  },
  getRestaurantOrderById: async (request, response) => {
    try {
      const { orderID } = request.params;
      const restaurantID = request.restaurantID;

      const order = await Order.findOne({
        _id: orderID,
        restaurantId: restaurantID,
      })
        .populate("userId", "userName phoneNumber")
        .populate("items.menuId", "itemName image");

      if (!order) {
        return response.status(404).json({
          message: "order not found.",
        });
      }

      response.status(200).json({
        message: "order fetched successfully.",
        order,
      });
    } catch (error) {
      response.status(500).json({
        message: "error getting order.",
        err: error.message,
      });
    }
  },
  updateOrderStatus: async (request, response) => {
    try {
      const { orderID } = request.params;

      const { status } = request.body;

      const restaurantID = request.restaurantID;

      const order = await Order.findOne({
        _id: orderID,
        restaurantId: restaurantID,
      });

      if (!order) {
        return response.status(404).json({
          message: "order not found.",
        });
      }

      const allowedStatus = [
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ];

      if (!allowedStatus.includes(status)) {
        return response.status(400).json({
          message: "invalid order status.",
        });
      }

      order.orderStatus = status;

      await order.save();

      response.status(200).json({
        message: "order status updated successfully.",
        order,
      });
    } catch (error) {
      response.status(500).json({
        message: "error updating order status.",
        err: error.message,
      });
    }
  },
};

module.exports = orderController;
