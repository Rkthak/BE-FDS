const express = require("express");
const authRouter = require("./router/authRouter");
const cookieParser = require("cookie-parser");
const restaurantRouter = require("./router/restaurantRouter");
const adminRouter = require("./router/adminRouter");
const menuRouter = require("./router/menuRouter");
const favoriteRouter = require("./router/favoriteRouter");
const cartRouter = require("./router/cartRouter");
const orderRouter = require("./router/orderRouter");

const app = express();

app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/restaurant", restaurantRouter);
app.use("/api/v1/restaurant", menuRouter);
app.use("/api/v1/favorite", favoriteRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/order", orderRouter);

module.exports = app;
