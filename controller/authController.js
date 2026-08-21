const User = require("../model/user");
const Restaurant = require("../model/restaurant");
const bcrypt = require("bcrypt");
const { SALT_ROUNDS, JWT_SECRET, ENV } = require("../utils/config");
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
      response
        .status(500)
        .json({ message: "error registering user.", err: error.message });
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
      response
        .status(500)
        .json({ message: "error login user", err: error.message });
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
      response
        .status(500)
        .json({ message: "error updating user", err: error.message });
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
      response
        .status(500)
        .json({ message: "error uploading profile image", err: error.message });
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
      response
        .status(500)
        .json({ message: "error deleting your account", err: error.message });
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
        from: process.env.EMAIL_USER,
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
      console.error("Send verification OTP error:", error);

      response.status(500).json({
        message: "Failed to send verification OTP",
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
      console.error("Verify OTP error:", error);

      return response.status(500).json({
        message: "Failed to verify OTP",
      });
    }
  },
};

module.exports = authController;
