const mongoose = require("mongoose");
const { MONGODB_URI, PORT, HOST } = require("./utils/config");
const app = require("./app");

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("mongodb connected");

    app
      .listen(PORT, HOST, () => {
        console.log("server listening ...");
      })
      .on("error", (err) => {
        console.log("Error starting the server", err.message);
      });
  })
  .catch((err) => {
    console.log("db connection error", err.message);
  });
