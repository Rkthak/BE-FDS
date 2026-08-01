const User = require("../model/user");
const bcrypt = require("bcrypt");
const { SALT_ROUNDS } = require("../utils/config");

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
  login: (request, response) => {
    try {
      response.status(200).json({ message: "user login successfull" });
    } catch (error) {
      response.status(500).json({ message: "error login user." });
    }
  },
  me: (request, response) => {
    try {
      response.status(200).json({ user: "user" });
    } catch (error) {
      response.status(500).json({ message: "error getting user." });
    }
  },
};

module.exports = authController;
