const mongoose = require("mongoose");
const { MONGODB_URI, PORT, HOST } = require("./utils/config");
const { server } = require("./app");

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("mongodb connected");

    server
      .listen(PORT, "0.0.0.0", () => {
        console.log("server listening ...");
      })
      .on("error", (err) => {
        console.log("Error starting the server", err.message);
      });
  })
  .catch((err) => {
    console.log("db connection error", err.message);
  });
