const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../utils/config");
const User = require("../model/user");

const auth = {
  isAuthenticated: async (request, response, next) => {
    try {
      const token = request.cookies?.token;

      if (!token) {
        return response
          .status(401)
          .json({ message: "Please log in to continue." });
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      request.userID = decoded.userID;

      next();
    } catch (error) {
      return response
        .status(401)
        .json({ message: "Invalid or expired session. Please log in again." });
    }
  },
  allowRoles: (roles) => {
    return async (request, response, next) => {
      const userID = request.userID;

      const existingUser = await User.findById(userID).select("-password -__v");

      if (!existingUser) {
        return response.status(404).json({ message: "User not found" });
      }

      if (!roles.includes(existingUser.role)) {
        return response.status(403).json({
          message:
            "You do not have the required role(s) to access this resource",
        });
      }

      request.user = existingUser;

      next();
    };
  },
};

module.exports = auth;
