const Restaurant = require("../model/restaurant");

const restaurantController = {
  createRestaurant: async (request, response) => {
    try {
      const {
        restaurantName,
        description,
        phoneNumber,
        cuisine,
        address,
        openingHours,
        deliveryTime,
        deliveryFee,
        minimumOrder,
      } = request.body;

      let slugedName = restaurantName.toLowerCase().trim().replaceAll(" ", "-"); // for uniquely handle if duplicate restaurant names !!

      const existingSlug = await Restaurant.findOne({ slug: slugedName });

      const generateRandom = () => {
        return Math.floor(Math.random() * 1e4);
      };

      if (existingSlug) {
        const unique = generateRandom();

        slugedName = slugedName + "-" + unique;
      }

      const newRestaurant = new Restaurant({
        restaurantName,
        description,
        phoneNumber,
        cuisine,
        address,
        openingHours,
        deliveryTime,
        deliveryFee,
        minimumOrder,
        slug: slugedName,
        ownerId: request.userID,
      });

      const savedRestaurant = await newRestaurant.save();

      // delete the __v property from the savedCompany object
      const { __v, ...result } = savedRestaurant.toObject();

      response.status(201).json({
        message: "restaurant registered successfully! Waiting for approval.",
        result,
      });
    } catch (error) {
      response
        .status(500)
        .json({ message: "error creating restaurent.", err: error.message });
    }
  },
  getRestaurants: async (request, response) => {
    try {
      const restaurants = await Restaurant.find()
        .select("-__v")
        .populate("ownerId", "userName email profileImage");

      response.status(200).json({ restaurants });
    } catch (error) {
      response
        .status(500)
        .json({ message: "error getting restaurants", err: error.message });
    }
  },
  getRestaurantsByID: async (request, response) => {
    try {
      const { slugID } = request.params;

      const restaurant = await Restaurant.findOne({ slug: slugID })
        .select("-__v")
        .populate("ownerId", "userName email profileImage");

      if (!restaurant) {
        return response.status(400).json({ message: "restaurant not found" });
      }

      response.status(200).json({ restaurant });
    } catch (error) {
      return response.status(500).json({ message: "error getting restaurant" });
    }
  },
};

module.exports = restaurantController;
