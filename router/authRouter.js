const express = require("express");
const { register, login, me, logout } = require("../controller/authController");
const { isAuthenticated } = require("../middleware/auth");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", isAuthenticated, me);
authRouter.post("/logout", isAuthenticated, logout);

module.exports = authRouter;
