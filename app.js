const express = require("express");
const authRouter = require("./router/authRouter");

const app = express();

app.use("/api/v1/auth", authRouter);

module.exports = app;
