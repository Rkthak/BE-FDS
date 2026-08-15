const cors = require("cors");
const express = require("express");
const authRouter = require("./router/authRouter");
const cookieParser = require("cookie-parser");
const restaurantRouter = require("./router/restaurantRouter");
const adminRouter = require("./router/adminRouter");
const menuRouter = require("./router/menuRouter");
const favoriteRouter = require("./router/favoriteRouter");
const cartRouter = require("./router/cartRouter");
const orderRouter = require("./router/orderRouter");
const paymentRouter = require("./router/paymentRouter");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const { initSocket } = require("./socket");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

initSocket(io);

io.on("connection", (socket) => {
  console.log("🔥 Socket connected:", socket.id);

  socket.on("join:admin", () => {
    socket.join("admins");

    console.log("👑 Admin joined");
  });

  socket.on("join:user", (userID) => {
    socket.join(`user:${userID}`);

    console.log(`👤 User ${userID} joined`);
  });

  socket.on("join:restaurant", (restaurantID) => {
    socket.join(`restaurant:${restaurantID}`);

    console.log(`🍽️ Restaurant ${restaurantID} joined`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

app.use("/uploads", express.static("uploads"));
app.use(
  cors({
    origin: "http://localhost:5173", // replace with your frontend URL
    credentials: true, // allow cookies to be sent
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/restaurant", restaurantRouter);
app.use("/api/v1/menu", menuRouter);
app.use("/api/v1/favorite", favoriteRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/payment", paymentRouter);

module.exports = {
  app,
  server,
  io,
};
