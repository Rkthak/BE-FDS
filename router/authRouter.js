const express = require("express");
const {
  register,
  login,
  me,
  logout,
  updateProfile,
  uploadProfileImage,
  deleteProfile,
} = require("../controller/authController");
const { isAuthenticated } = require("../middleware/auth");
const upload = require("../middleware/uploadImage");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", isAuthenticated, me);
authRouter.post("/logout", isAuthenticated, logout);
authRouter.put("/profile", isAuthenticated, updateProfile);
authRouter.put(
  "/upload-profileImage",
  isAuthenticated,
  upload.single("profileImage"),
  uploadProfileImage,
);
authRouter.delete("/me", isAuthenticated, deleteProfile);
module.exports = authRouter;
