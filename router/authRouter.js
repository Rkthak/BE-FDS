const express = require("express");
const {
  register,
  login,
  me,
  logout,
  updateProfile,
} = require("../controller/authController");
const { isAuthenticated } = require("../middleware/auth");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", isAuthenticated, me);
authRouter.post("/logout", isAuthenticated, logout);
authRouter.put("/profile", isAuthenticated, updateProfile);

module.exports = authRouter;
