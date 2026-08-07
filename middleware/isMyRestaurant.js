const Restaurant = require("../model/restaurant");

const isMyRestaurant = async (request, response, next) => {
  const { slugID } = request.params;
  const user = request.user;

  const restaurant = await Restaurant.findOne({
    slug: slugID,
    ownerId: user._id,
  });

  if (!restaurant) {
    return response.status(404).json({
      message: "Restaurant not found or you don't have permission.",
    });
  }

  request.restaurant = restaurant;

  next();
};

module.exports = isMyRestaurant;
