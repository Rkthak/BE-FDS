const mongoose = require("mongoose");
const Restaurant = require("../model/restaurant");
const User = require("../model/user");
const generateSlug = require("../utils/generateSlug");
const Menu = require("../model/menu");

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

      const logo = request.files?.restaurantLogo?.[0];
      const banner = request.files?.restaurantBanner?.[0];

      const existingPhoneNumber = await Restaurant.findOne({ phoneNumber });

      if (existingPhoneNumber) {
        return response.status(409).json({
          message:
            "This phone number is already registered with another restaurant.",
        });
      }

      let slug = await generateSlug(restaurantName, Restaurant);

      const newRestaurant = new Restaurant({
        restaurantName,
        description,
        phoneNumber,
        cuisine: JSON.parse(cuisine),
        address: JSON.parse(address),
        openingHours: JSON.parse(openingHours),
        deliveryTime,
        deliveryFee,
        minimumOrder,
        slug,
        logo: logo ? logo.path.replace(/\\/g, "/") : "",
        banner: banner ? banner.path.replace(/\\/g, "/") : "",
        ownerId: request.userID,
      });

      const savedRestaurant = await newRestaurant.save();

      const { __v, ...result } = savedRestaurant.toObject();

      response.status(201).json({
        message: "Restaurant registered successfully! Waiting for approval.",
        result,
      });
    } catch (error) {
      response.status(500).json({
        message: "Error creating restaurant.",
        err: error.message,
      });
    }
  },

  // public get Restaurant for all users
  getRestaurants: async (request, response) => {
    try {
      const restaurants = await Restaurant.find({
        status: "approved",
        isOpen: true,
      }).select("-__v -ownerId");

      response.status(200).json({
        message: restaurants.length
          ? "Restaurants fetched successfully."
          : "No restaurants are available at the moment.",
        restaurants,
      });
    } catch (error) {
      response
        .status(500)
        .json({ message: "error getting restaurants", err: error.message });
    }
  },
  getRestaurantsByID: async (request, response) => {
    try {
      const { slugID } = request.params;

      const restaurant = await Restaurant.findOne({
        slug: slugID,
        status: "approved",
        isOpen: true,
      }).select("-__v -ownerId");

      if (!restaurant) {
        return response.status(404).json({ message: "restaurant not found" });
      }

      response.status(200).json(restaurant);
    } catch (error) {
      return response
        .status(500)
        .json({ message: "error getting restaurant", err: error.message });
    }
  },
  searchRestaurantByFilters: async (request, response) => {
    try {
      const { location, cuisine, ratings, minPrice, maxPrice } = request.query;
      const restaurantQuery = {
        status: "approved",
        isOpen: true,
      };

      if (minPrice || maxPrice) {
        const menuQuerry = {
          isAvailable: true,
        };

        if (minPrice && maxPrice) {
          menuQuerry.price = {
            $gte: Number(minPrice),
            $lte: Number(maxPrice),
          };
        } else if (maxPrice) {
          menuQuerry.price = {
            $lte: Number(maxPrice),
          };
        } else if (minPrice) {
          menuQuerry.price = {
            $gte: Number(minPrice),
          };
        }

        const menu = await Menu.find(menuQuerry);

        const restaurantIDs = menu.map((item) => item.restaurantId);

        restaurantQuery._id = {
          $in: restaurantIDs,
        };
      }

      if (location) {
        restaurantQuery["address.city"] = location;
      }

      if (cuisine) {
        restaurantQuery["cuisine"] = cuisine;
      }

      if (ratings) {
        restaurantQuery["rating"] = { $gte: Number(ratings) };
      }

      const restaurant = await Restaurant.find(restaurantQuery);

      response
        .status(200)
        .json(
          restaurant.length > 0
            ? restaurant
            : { message: "no restaurant available according to filters" },
        );
    } catch (error) {
      response
        .status(500)
        .json({ message: "error searching restaurant", err: error.message });
    }
  },

  // protected only for Restautants
  getMyRestaurant: async (request, response) => {
    try {
      const userID = request.userID;

      const restaurant = await Restaurant.find({ ownerId: userID });

      if (!restaurant || restaurant.length == 0) {
        return response.status(404).json({
          message: "you haven't applied to become a restaurant yet.",
        });
      }

      response.status(200).json(restaurant);
    } catch (error) {
      return response
        .status(500)
        .json({ message: "error getting restaurant", err: error.message });
    }
  },
  getMyRestaurantByID: async (request, response) => {
    try {
      const restaurant = request.restaurant;

      response.status(200).json(restaurant);
    } catch (error) {
      response
        .status(500)
        .json({ message: "error getting restaurant", err: error.message });
    }
  },
  updateMyRestaurant: async (request, response) => {
    try {
      const restaurant = request.restaurant;
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
        isOpen,
      } = request.body;

      if (
        restaurantName &&
        restaurant.restaurantName !== restaurantName.trim()
      ) {
        restaurant.restaurantName = restaurantName.trim();

        restaurant.slug = await generateSlug(
          restaurantName.trim(),
          Restaurant,
          restaurant._id,
        );
      }
      restaurant.description = description ?? restaurant.description;
      restaurant.phoneNumber = phoneNumber ?? restaurant.phoneNumber;
      restaurant.cuisine = cuisine ?? restaurant.cuisine;
      restaurant.address = address ?? restaurant.address;
      restaurant.openingHours = openingHours ?? restaurant.openingHours;
      restaurant.deliveryTime = deliveryTime ?? restaurant.deliveryTime;
      restaurant.deliveryFee = deliveryFee ?? restaurant.deliveryFee;
      restaurant.minimumOrder = minimumOrder ?? restaurant.minimumOrder;
      restaurant.isOpen = isOpen ?? restaurant.isOpen;

      if (restaurant.status === "rejected") {
        restaurant.status = "pending";
        restaurant.rejectionReason = null;
      }

      await restaurant.save();
      response
        .status(200)
        .json({ message: "updated successfully", restaurant });
    } catch (error) {
      return response
        .status(500)
        .json({ message: "error updating restaurant", err: error.message });
    }
  },
  deleteMyRestaurant: async (request, response) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const userID = request.userID;
      const { slugID } = request.params;

      const restaurant = await Restaurant.findOne({
        ownerId: userID,
        slug: slugID,
      }).session(session);

      if (!restaurant) {
        await session.abortTransaction();
        return response.status(404).json({
          message: "Restaurant not found or you don't have permission.",
        });
      }

      const totalRestaurants = await Restaurant.countDocuments({
        ownerId: userID,
      }).session(session);

      await restaurant.deleteOne({ session });

      if (totalRestaurants === 1) {
        await User.findByIdAndUpdate(
          userID,
          {
            role: "user",
          },
          { session },
        );
      }

      await session.commitTransaction();

      response.status(200).json({
        message: "Restaurant deleted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      return response
        .status(500)
        .json({ message: "error deleting restaurant", err: error.message });
    } finally {
      session.endSession();
    }
  },
  uploadLogo: async (request, response) => {
    try {
      const restaurant = request.restaurant;

      if (!request.file) {
        return response.status(400).json({
          message: "please upload a logo.",
        });
      }

      restaurant.logo = request.file.path.replace(/\\/g, "/");

      await restaurant.save();

      response.status(200).json({
        message: "logo uploaded successfully.",
        logo: restaurant.logo,
      });
    } catch (error) {
      response.status(500).json({
        message: "error uploading logo.",
        err: error.message,
      });
    }
  },
  uploadBanner: async (request, response) => {
    try {
      const restaurant = request.restaurant;

      if (!request.file) {
        return response.status(400).json({
          message: "please upload a banner.",
        });
      }

      restaurant.banner = request.file.path.replace(/\\/g, "/");

      await restaurant.save();

      response.status(200).json({
        message: "banner uploaded successfully.",
        banner: restaurant.banner,
      });
    } catch (error) {
      response.status(500).json({
        message: "error uploading banner.",
        err: error.message,
      });
    }
  },
};

module.exports = restaurantController;
