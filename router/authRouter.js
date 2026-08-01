const express = require("express");
const { register, login, me } = require("../controller/authController");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", me);

module.exports = authRouter;
