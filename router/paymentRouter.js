const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const {
  createPayment,
  verifyPayment,
} = require("../controller/paymentController");

const paymentRouter = express.Router();

paymentRouter.post("/create", isAuthenticated, createPayment);
paymentRouter.post("/verify", isAuthenticated, verifyPayment);

module.exports = paymentRouter;
