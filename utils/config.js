require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT;
const HOST = process.env.HOST || "0.0.0.0";
const SALT_ROUNDS = process.env.SALT_ROUNDS;
const ENV = process.env.ENV;
const JWT_SECRET = process.env.JWT_SECRET;
const RAZORPAY_TEST_API_KEY = process.env.RAZORPAY_TEST_API_KEY;
const RAZORPAY_TEST_KEY_SECRET = process.env.RAZORPAY_TEST_KEY_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
module.exports = {
  MONGODB_URI,
  PORT,
  HOST,
  SALT_ROUNDS,
  ENV,
  JWT_SECRET,
  RAZORPAY_TEST_API_KEY,
  RAZORPAY_TEST_KEY_SECRET,
  EMAIL_USER,
  EMAIL_PASS,
};
