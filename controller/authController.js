const User = require("../model/user");
const Restaurant = require("../model/restaurant");
const bcrypt = require("bcrypt");
const { SALT_ROUNDS, JWT_SECRET, ENV, EMAIL_USER } = require("../utils/config");
const jwt = require("jsonwebtoken");
const transporter = require("../utils/mailer");

const authController = {
  register: async (request, response) => {
    try {
      const { userName, email, password } = request.body;

      if (userName.length < 3) {
        return response.status(400).json({
          message: "Username must be at least 3 characters long",
        });
      }

      if (password.length < 6) {
        return response.status(400).json({
          message: "password must be at least 6 characters long",
        });
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return response.status(409).json({ message: "user already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, Number(SALT_ROUNDS));

      const newUser = new User({
        userName,
        email,
        password: hashedPassword,
      });

      await newUser.save();

      response.status(201).json({ message: "user register successfull" });
    } catch (error) {
      response.status(500).json({
        message: "Unable to complete registration. Please try again later.",
        err: error.message,
      });
    }
  },
  login: async (request, response) => {
    try {
      const { email, password } = request.body;

      if (!email?.trim() || !password) {
        return response
          .status(400)
          .json({ message: "Email and password are required." });
      }

      const existingUser = await User.findOne({ email });

      if (!existingUser) {
        return response
          .status(401)
          .json({ message: "invalid email or password" });
      }

      const passwordMatch = await bcrypt.compare(
        password,
        existingUser.password,
      );

      if (!passwordMatch) {
        return response
          .status(401)
          .json({ message: "invailid email or password" });
      }

      const token = await jwt.sign(
        { userID: existingUser._id, role: existingUser.role },
        JWT_SECRET,
        {
          expiresIn: "1h",
        },
      );

      // set the cookie with the token
      response.cookie("token", token, {
        httpOnly: true,
        secure: ENV === "production", // set secure flag only in production
        sameSite: ENV === "production" ? "none" : "lax", // set sameSite flag based on environment
        maxAge: 1000 * 60 * 60, // set cookie expiration time to 1 hour
      });

      response.status(200).json({
        message: "user login successfull",
        user: {
          _id: existingUser._id,
          userName: existingUser.userName,
          email: existingUser.email,
          role: existingUser.role,
        },
      });
    } catch (error) {
      response.status(500).json({
        message:
          "Something went wrong while logging in. Please try again later.",
        err: error.message,
      });
    }
  },
  me: async (request, response) => {
    try {
      const userID = request.userID;

      const existingUser = await User.findById(userID).select("-password -__v");

      if (!existingUser) {
        return response.status(404).json({ message: "no user found" });
      }

      response.status(200).json({ user: existingUser || null });
    } catch (error) {
      response
        .status(500)
        .json({ message: "error getting user", err: error.message });
    }
  },
  logout: async (request, response) => {
    try {
      response.clearCookie("token", {
        httpOnly: true,
        secure: ENV === "production", // set secure flag only in production
        sameSite: ENV === "production" ? "none" : "lax", // set sameSite flag based on environment
        maxAge: 1000 * 60 * 60, // set cookie expiration time to 1 hour
      });

      response.status(200).json({ message: "user logged out!" });
    } catch (error) {
      response
        .status(500)
        .json({ message: "error logging out user", err: error.message });
    }
  },
  updateProfile: async (request, response) => {
    try {
      const { userName, email, addresses, phoneNumber } = request.body;

      const userID = request.userID;

      const existingUser = await User.findById(userID).select("-password -__v");

      if (!existingUser) {
        return response.status(404).json({ message: "user not found" });
      }

      if (userName && userName.length < 3) {
        return response.status(400).json({
          message: "username must be at least 3 characters long.",
        });
      }

      existingUser.userName = userName ?? existingUser.userName;
      existingUser.email = email ?? existingUser.email;
      existingUser.addresses = addresses ?? existingUser.addresses;
      existingUser.phoneNumber = phoneNumber ?? existingUser.phoneNumber;

      await existingUser.save();

      response
        .status(200)
        .json({ message: "user updated successfully!", user: existingUser });
    } catch (error) {
      response.status(500).json({
        message:
          "Something went wrong while updating profile. Please try again later.",
        err: error.message,
      });
      console.log(error);
    }
  },
  uploadProfileImage: async (request, response) => {
    try {
      const userID = request.userID;

      if (!request.file) {
        return response.status(200).json({ message: "please choose an image" });
      }

      const existingUser = await User.findById(userID);

      if (!existingUser) {
        return response.status(400).json({ message: "user not found" });
      }

      existingUser.profileImage =
        request.file.path.replace(/\\/g, "/") ?? existingUser.profileImage;

      await existingUser.save();

      response.status(200).json({
        message: "profile image uploaded successfully",
        user: existingUser,
      });
    } catch (error) {
      response.status(500).json({
        message:
          "Something went wrong while uploading profile image. Please try again later. ",
        err: error.message,
      });
    }
  },
  forgotPassword: async (request, response) => {
    try {
      const { email, newPassword, confirmPassword } = request.body;

      if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Please fill in all fields.",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match.",
        });
      }

      if (newPassword.length < 6) {
        return response.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long.",
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found with this email.",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashedPassword;
      await user.save();

      return response.status(200).json({
        success: true,
        message: "Password updated successfully. Please login again.",
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "Something went wrong while resetting your password.",
      });
    }
  },

  deleteProfile: async (request, response) => {
    try {
      const userID = request.userID;

      const user = await User.findById(userID);

      if (!user) {
        return response.status(404).json({
          message: "user not found.",
        });
      }

      if (user.role === "admin") {
        return response.status(403).json({
          message: "admin accounts cannot be deleted.",
        });
      }

      const restaurant = await Restaurant.findOne({ ownerId: userID });

      if (restaurant) {
        return response.status(409).json({
          message:
            "please delete your restaurant before deleting your account.",
        });
      }

      await user.deleteOne();

      response.clearCookie("token", {
        httpOnly: true,
        secure: ENV === "production",
        sameSite: ENV === "production" ? "none" : "lax",
      });

      response.status(200).json({ message: "profile deleted successfully" });
    } catch (error) {
      response.status(500).json({
        message:
          "Something went wrong while deleting your account. Please try again later.",
        err: error.message,
      });
    }
  },
  sendVerificationOTP: async (request, response) => {
    try {
      const userID = request.userID;

      const user = await User.findById(userID);

      if (!user) {
        return response.status(404).json({
          message: "User not found",
        });
      }

      if (user.isVerified) {
        return response.status(400).json({
          message: "Email is already verified",
        });
      }

      // Generate 6 digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // OTP valid for 5 minutes
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      await User.findByIdAndUpdate(
        userID,
        {
          $set: {
            verificationOTP: otp,
            verificationOTPExpires: otpExpires,
          },
        },

        { runValidators: false },
      );

      await transporter.sendMail({
        from: EMAIL_USER,
        to: user.email,
        subject: "FoodRush Email Verification OTP",
        html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>FoodRush Email Verification</h2>
          <p>Your verification OTP is:</p>

          <h1 style="letter-spacing: 8px;">
            ${otp}
          </h1>

          <p>This OTP will expire in 5 minutes.</p>

          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
      });

      response.status(200).json({
        message: "Verification OTP sent successfully",
      });
    } catch (error) {
      response.status(500).json({
        message: "Failed to send verification code. Please try again later",
      });
    }
  },
  verifyVerificationOTP: async (request, response) => {
    try {
      const userID = request.userID;
      const { otp } = request.body;

      const user = await User.findById(userID);

      if (!user) {
        return response.status(404).json({
          message: "User not found",
        });
      }

      if (user.isVerified) {
        return response.status(400).json({
          message: "Email is already verified",
        });
      }

      if (!otp) {
        return response.status(400).json({
          message: "OTP is required",
        });
      }

      if (!user.verificationOTP || !user.verificationOTPExpires) {
        return response.status(400).json({
          message: "OTP not found. Please request a new OTP",
        });
      }

      if (user.verificationOTPExpires < new Date()) {
        return response.status(400).json({
          message: "OTP has expired",
        });
      }

      if (user.verificationOTP !== otp) {
        return response.status(400).json({
          message: "Invalid OTP",
        });
      }

      // OTP correct
      await User.findByIdAndUpdate(
        userID,
        {
          $set: {
            isVerified: true,
          },
          $unset: {
            verificationOTP: "",
            verificationOTPExpires: "",
          },
        },
        { runValidators: false },
      );

      return response.status(200).json({
        message: "Email verified successfully",
      });
    } catch (error) {
      return response.status(500).json({
        message: "Failed to verify code. Please try again",
      });
    }
  },
  sendResetPasswordOTP: async (request, response) => {
    try {
      const { email } = request.body;

      if (!email?.trim()) {
        return response.status(400).json({
          message: "Email is required.",
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return response.status(404).json({
          message: "No account found with this email.",
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      await User.findOneAndUpdate(
        { email: email },
        {
          $set: {
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: otpExpires,
          },
        },

        { runValidators: false },
      );

      await transporter.sendMail({
        from: EMAIL_USER,
        to: user.email,
        subject: "FoodRush Password Reset OTP",
        html: `
        <h2>FoodRush Password Reset</h2>
        <p>Your password reset OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      `,
      });

      return response.status(200).json({
        message: "Password reset OTP sent successfully.",
      });
    } catch (error) {
      console.log(error);

      return response.status(500).json({
        message: "Failed to send password reset OTP. Please try again later.",
      });
    }
  },
  resetPassword: async (request, response) => {
    try {
      const { email, otp, newPassword, confirmPassword } = request.body;

      if (!email || !otp || !newPassword || !confirmPassword) {
        return response.status(400).json({
          message: "Please fill in all fields.",
        });
      }

      if (newPassword !== confirmPassword) {
        return response.status(400).json({
          message: "Passwords do not match.",
        });
      }

      if (newPassword.length < 6) {
        return response.status(400).json({
          message: "Password must be at least 6 characters long.",
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return response.status(404).json({
          message: "No account found with this email.",
        });
      }

      // OTP exist karta hai ya nahi
      if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
        return response.status(400).json({
          message: "OTP not found. Please request a new OTP.",
        });
      }

      // OTP expire hua ya nahi
      if (user.resetPasswordOTPExpires < new Date()) {
        return response.status(400).json({
          message: "OTP has expired. Please request a new OTP.",
        });
      }

      // OTP match
      if (user.resetPasswordOTP !== otp) {
        return response.status(400).json({
          message: "Invalid OTP.",
        });
      }

      const hashedPassword = await bcrypt.hash(
        newPassword,
        Number(SALT_ROUNDS),
      );

      await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            password: hashedPassword,
          },
          $unset: {
            resetPasswordOTP: "",
            resetPasswordOTPExpires: "",
          },
        },
        {
          runValidators: false,
        },
      );

      return response.status(200).json({
        message: "Password updated successfully. Please login again.",
      });
    } catch (error) {
      return response.status(500).json({
        message: "Something went wrong while resetting your password.",
      });
    }
  },
};

module.exports = authController;
