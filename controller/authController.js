const authController = {
  register: (request, response) => {
    try {
      response.status(200).json({ message: "user register successfull" });
    } catch (error) {
      response.status(500).json({ message: "error registering user." });
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
