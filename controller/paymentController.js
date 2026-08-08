const Razorpay = require("razorpay");
const Order = require("../model/order");
const {
  RAZORPAY_TEST_API_KEY,
  RAZORPAY_TEST_KEY_SECRET,
} = require("../utils/config");
const Payment = require("../model/payment");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: RAZORPAY_TEST_API_KEY,
  key_secret: RAZORPAY_TEST_KEY_SECRET,
});

const paymentController = {
  createPayment: async (request, response) => {
    try {
      const { orderID } = request.body;

      const order = await Order.findById(orderID);

      if (!order) {
        return response.status(404).json({
          message: "order not found",
        });
      }

      const options = {
        amount: order.totalAmount * 100,
        currency: "INR",
        receipt: order._id.toString(),
      };

      const razorpayOrder = await razorpay.orders.create(options);

      const payment = new Payment({
        userId: order.userId,
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });

      await payment.save();

      response.status(201).json({
        message: "payment order created",
        paymentId: payment._id,
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
  verifyPayment: async (request, response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        request.body;

      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return response.status(400).json({
          message: "Invalid payment signature",
        });
      }

      const payment = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
      });

      if (!payment) {
        return response.status(404).json({
          message: "Payment not found",
        });
      }

      payment.razorpayPaymentId = razorpay_payment_id;
      payment.status = "paid";

      await payment.save();

      const order = await Order.findById(payment.orderId);

      if (order) {
        order.paymentStatus = "paid";
        order.paymentMethod = "RAZORPAY";

        await order.save();
      }

      response.status(200).json({
        message: "Payment verified successfully",
      });
    } catch (error) {
      response.status(500).json({
        message: "Error verifying payment",
        err: error.message,
      });
    }
  },
};

module.exports = paymentController;
