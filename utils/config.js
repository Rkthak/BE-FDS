require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT;
const HOST = process.env.HOST;
const SALT_ROUNDS = process.env.SALT_ROUNDS;
const ENV = process.env.ENV;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = {
  MONGODB_URI,
  PORT,
  HOST,
  SALT_ROUNDS,
  ENV,
  JWT_SECRET,
};
