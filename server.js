const mongoose = require("mongoose");
const { MONGODB_URI } = require("./utils/config");

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("mongodb connected");
  })
  .catch((err) => {
    console.log("db connection error", err.message);
  });
