require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT;
const HOST = process.env.HOST;
const SALT_ROUNDS = process.env.SALT_ROUNDS;

module.exports = {
  MONGODB_URI,
  PORT,
  HOST,
  SALT_ROUNDS,
};
