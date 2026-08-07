const Restaurant = require("../model/restaurant");

const isApprovedRestaurant = async (request, response, next) => {
  const restaurant = await Restaurant.findOne({
    ownerId: request.user._id,
    status: "approved",
  });

  if (!restaurant) {
    return response.status(404).json({
      message: "You are not authorized to access this restaurant.",
    });
  }

  request.restaurantID = restaurant._id;

  next();
};

module.exports = isApprovedRestaurant;
