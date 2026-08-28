const express = require("express");
const { isAuthenticated, allowRoles } = require("../middleware/auth");
const {
  createPayment,
  verifyPayment,
  getMyPayments,
} = require("../controller/paymentController");

const paymentRouter = express.Router();

paymentRouter.post(
  "/create",
  isAuthenticated,
  allowRoles(["user"]),
  createPayment,
);
paymentRouter.post(
  "/verify",
  isAuthenticated,
  allowRoles(["user"]),
  verifyPayment,
);
paymentRouter.get("/my", isAuthenticated, allowRoles(["user"]), getMyPayments);

module.exports = paymentRouter;
