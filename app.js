const express = require("express");
const authRouter = require("./router/authRouter");

const app = express();

app.use(express.json());

app.use("/api/v1/auth", authRouter);

module.exports = app;
