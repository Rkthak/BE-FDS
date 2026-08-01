const express = require("express");
const { register, login, me } = require("../controller/authController");
const { isAuthenticated } = require("../middleware/auth");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", isAuthenticated, me);

module.exports = authRouter;
