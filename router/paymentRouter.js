const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const {
  createPayment,
  verifyPayment,
  getMyPayments,
} = require("../controller/paymentController");

const paymentRouter = express.Router();

paymentRouter.post("/create", isAuthenticated, createPayment);
paymentRouter.post("/verify", isAuthenticated, verifyPayment);
paymentRouter.get("/my", isAuthenticated, getMyPayments);

module.exports = paymentRouter;
