const express = require("express");
const authRouter = require("./router/authRouter");
const cookieParser = require("cookie-parser");
const restaurantRouter = require("./router/restaurantRouter");

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/restaurant", restaurantRouter);

module.exports = app;
