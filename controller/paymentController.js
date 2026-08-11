const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const Order = require("../model/order");
const Cart = require("../model/cart");
const User = require("../model/user");
const Payment = require("../model/payment");

const {
  RAZORPAY_TEST_API_KEY,
  RAZORPAY_TEST_KEY_SECRET,
} = require("../utils/config");

const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: RAZORPAY_TEST_API_KEY,
  key_secret: RAZORPAY_TEST_KEY_SECRET,
});

const paymentController = {
  // =========================
  // CREATE RAZORPAY PAYMENT
  // =========================
  createPayment: async (request, response) => {
    try {
      const userID = request.userID;

      const cart = await Cart.findOne({
        userId: userID,
      }).populate("items.menuId");

      if (!cart) {
        return response.status(404).json({
          message: "cart not found",
        });
      }

      if (cart.items.length === 0) {
        return response.status(400).json({
          message: "cart is empty",
        });
      }

      // Check menu items
      for (const item of cart.items) {
        const menu = item.menuId;

        if (!menu) {
          return response.status(400).json({
            message: "dish not found",
          });
        }

        if (!menu.isAvailable) {
          return response.status(400).json({
            message: `${menu.itemName} is not available`,
          });
        }
      }

      const options = {
        amount: cart.totalAmount * 100,
        currency: "INR",
        receipt: `cart_${cart._id}`,
      };

      const razorpayOrder = await razorpay.orders.create(options);

      const payment = new Payment({
        userId: userID,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        status: "pending",
      });

      await payment.save();

      response.status(201).json({
        message: "payment order created",
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    } catch (error) {
      response.status(500).json({
        message: "error creating payment",
        err: error.message,
      });
    }
  },

  // =========================
  // VERIFY PAYMENT + CREATE ORDER
  // =========================
  verifyPayment: async (request, response) => {
    const session = await mongoose.startSession();

    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        request.body;

      // Verify Razorpay signature FIRST
      const generatedSignature = crypto
        .createHmac("sha256", RAZORPAY_TEST_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return response.status(400).json({
          message: "Invalid payment signature",
        });
      }

      session.startTransaction();

      // Find payment
      const payment = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
        userId: request.userID,
      }).session(session);

      if (!payment) {
        await session.abortTransaction();

        return response.status(404).json({
          message: "Payment not found",
        });
      }

      // Prevent duplicate verification
      if (payment.status === "paid") {
        await session.abortTransaction();

        return response.status(400).json({
          message: "Payment already verified",
        });
      }

      // Get cart
      const cart = await Cart.findOne({
        userId: request.userID,
      })
        .populate("items.menuId")
        .session(session);

      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();

        return response.status(400).json({
          message: "Cart not found or empty",
        });
      }

      // Check menu items again
      for (const item of cart.items) {
        const menu = item.menuId;

        if (!menu) {
          await session.abortTransaction();

          return response.status(400).json({
            message: "dish not found",
          });
        }

        if (!menu.isAvailable) {
          await session.abortTransaction();

          return response.status(400).json({
            message: `${menu.itemName} is not available`,
          });
        }
      }

      // Get user
      const user = await User.findById(request.userID).session(session);

      if (!user) {
        await session.abortTransaction();

        return response.status(404).json({
          message: "user not found",
        });
      }

      // Check address
      if (!user.addresses) {
        await session.abortTransaction();

        return response.status(400).json({
          message: "please provide a valid address for delivery",
        });
      }

      // Create actual order
      const order = new Order({
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

        paymentMethod: "ONLINE",
        paymentStatus: "paid",

        orderStatus: "pending",
      });

      await order.save({ session });

      // Update payment
      payment.orderId = order._id;
      payment.razorpayPaymentId = razorpay_payment_id;
      payment.status = "paid";

      await payment.save({ session });

      // Delete cart
      await cart.deleteOne({ session });

      // Add order to user
      user.orders.push(order._id);

      await user.save({ session });

      // Everything successful
      await session.commitTransaction();

      response.status(200).json({
        message: "Payment verified and order placed successfully",
        order,
      });
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      response.status(500).json({
        message: "Error verifying payment",
        err: error.message,
      });
    } finally {
      await session.endSession();
    }
  },

  // =========================
  // GET PAYMENT
  // =========================

  getMyPayments: async (request, response) => {
    try {
      const userID = request.userID;

      const payments = await Payment.find({
        userId: userID,
      })
        .populate("orderId", "totalAmount orderStatus createdAt")
        .sort({ createdAt: -1 });

      response.status(200).json({
        message: "payment history fetched successfully",
        payments,
      });
    } catch (error) {
      response.status(500).json({
        message: "error getting payment history",
        err: error.message,
      });
    }
  },
};

module.exports = paymentController;
