const User = require("../model/user");
const Restaurant = require("../model/restaurant");

const favoriteController = {
  updateFavoriteRestaurant: async (request, response) => {
    try {
      const { restaurantID } = request.params;
      const userID = request.userID;

      const restaurant = await Restaurant.findOne({
        _id: restaurantID,
        status: "approved",
      });

      if (!restaurant) {
        return response.status(404).json({
          message: "restaurant not found",
        });
      }

      const user = await User.findById(userID);

      if (!user) {
        return response.status(404).json({
          message: "user not found",
        });
      }

      const isFavorite = user.favoriteRestaurants.some((id) => {
        return id.toString() === restaurantID;
      });

      if (isFavorite) {
        user.favoriteRestaurants.pull(restaurantID);

        await user.save();

        return response.status(200).json({
          message: "restaurant removed from favorites",
        });
      }

      user.favoriteRestaurants.push(restaurantID);

      await user.save();

      response.status(200).json({
        message: "restaurant added to favorites",
      });
    } catch (error) {
      response.status(500).json({
        message: "error updating favorite restaurant",
        err: error.message,
      });
    }
  },

  getFavoriteRestaurants: async (request, response) => {
    try {
      const userID = request.userID;
      const user = await User.findById(request.userID).populate(
        "favoriteRestaurants",
        "restaurantName slug logo cuisine rating address",
      );

      if (!user) {
        return response.status(404).json({
          message: "User not found.",
        });
      }

      response.status(200).json({
        favoriteRestaurants: user.favoriteRestaurants,
      });
    } catch (error) {
      response.status(500).json({
        message: "Error getting favorite restaurants.",
        err: error.message,
      });
    }
  },
};

module.exports = favoriteController;
