const User = require("../model/user");
const bcrypt = require("bcrypt");
const { SALT_ROUNDS, JWT_SECRET, ENV } = require("../utils/config");
const jwt = require("jsonwebtoken");

const authController = {
  register: async (request, response) => {
    try {
      const { userName, email, password } = request.body;

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

      response.status(200).json({ message: "user login successfull" });
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

      response.status(200).json({ existingUser });
    } catch (error) {
      response
        .status(500)
        .json({ message: "error getting user", err: error.message });
    }
  },
};

module.exports = authController;
