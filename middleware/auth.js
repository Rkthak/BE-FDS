const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../utils/config");
const User = require("../model/user");

const auth = {
  isAuthenticated: async (request, response, next) => {
    const token = request.cookies && request.cookies.token;

    if (!token) {
      return response
        .status(401)
        .json({ message: "User is not authenticated" });
    }

    const decoded = await jwt.verify(token, JWT_SECRET);

    request.userID = decoded.userID;

    next();
  },
};

module.exports = auth;
