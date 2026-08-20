const mongoose = require("mongoose");
const Restaurant = require("../model/restaurant");
const User = require("../model/user");
const generateSlug = require("../utils/generateSlug");
const Menu = require("../model/menu");
const { getIO } = require("../socket");

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

      // ================= BASIC VALIDATION =================

      if (!restaurantName || !restaurantName.trim()) {
        return response.status(400).json({
          message: "Restaurant name is required.",
        });
      }

      if (restaurantName.trim().length < 2) {
        return response.status(400).json({
          message: "Restaurant name must contain at least 2 characters.",
        });
      }

      if (!phoneNumber || !/^[0-9]{10}$/.test(phoneNumber)) {
        return response.status(400).json({
          message: "Phone number must contain exactly 10 digits.",
        });
      }

      if (!cuisine) {
        return response.status(400).json({
          message: "Cuisine is required.",
        });
      }

      if (!address) {
        return response.status(400).json({
          message: "Address is required.",
        });
      }

      if (!openingHours) {
        return response.status(400).json({
          message: "Opening hours are required.",
        });
      }

      // ================= NUMERIC VALIDATION =================

      if (
        deliveryTime === undefined ||
        deliveryTime === "" ||
        Number(deliveryTime) <= 0
      ) {
        return response.status(400).json({
          message: "Delivery time must be greater than 0.",
        });
      }

      if (deliveryFee === undefined || Number(deliveryFee) < 0) {
        return response.status(400).json({
          message: "Delivery fee cannot be negative.",
        });
      }

      if (minimumOrder === undefined || Number(minimumOrder) < 0) {
        return response.status(400).json({
          message: "Minimum order cannot be negative.",
        });
      }

      // ================= JSON VALIDATION =================

      let parsedCuisine;
      let parsedAddress;
      let parsedOpeningHours;

      try {
        parsedCuisine = JSON.parse(cuisine);
        parsedAddress = JSON.parse(address);
        parsedOpeningHours = JSON.parse(openingHours);
      } catch (error) {
        return response.status(400).json({
          message: "Invalid restaurant data format.",
        });
      }

      // ================= DUPLICATE PHONE =================

      const existingPhoneNumber = await Restaurant.findOne({
        phoneNumber,
      });

      if (existingPhoneNumber) {
        return response.status(409).json({
          message:
            "This phone number is already registered with another restaurant.",
        });
      }

      // ================= CREATE RESTAURANT =================

      const slug = await generateSlug(restaurantName.trim(), Restaurant);

      const newRestaurant = new Restaurant({
        restaurantName: restaurantName.trim(),
        description: description?.trim() || "",
        phoneNumber,
        cuisine: parsedCuisine,
        address: parsedAddress,
        openingHours: parsedOpeningHours,
        deliveryTime: Number(deliveryTime),
        deliveryFee: Number(deliveryFee),
        minimumOrder: Number(minimumOrder),
        slug,
        logo: logo ? logo.path.replace(/\\/g, "/") : "",
        banner: banner ? banner.path.replace(/\\/g, "/") : "",
        ownerId: request.userID,
      });

      const savedRestaurant = await newRestaurant.save();

      // ================= SOCKET NOTIFICATION =================

      const io = getIO();

      io.to("admins").emit("restaurant:application:new", {
        restaurant: savedRestaurant,
      });

      const { __v, ...result } = savedRestaurant.toObject();

      return response.status(201).json({
        message: "Restaurant registered successfully! Waiting for approval.",
        result,
      });
    } catch (error) {
      // ================= MONGOOSE VALIDATION ERROR =================

      if (error.name === "ValidationError") {
        return response.status(400).json({
          message: "Invalid restaurant data.",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      // ================= DUPLICATE KEY ERROR =================

      if (error.code === 11000) {
        return response.status(409).json({
          message: "This restaurant data already exists.",
        });
      }

      return response.status(500).json({
        message: "Error creating restaurant.",
        err: error.message,
      });
    }
  },
  getMyRestaurantApplication: async (request, response) => {
    try {
      const userID = request.userID;

      const restaurant = await Restaurant.findOne({
        ownerId: userID,
      }).select("-__v");

      if (!restaurant) {
        return response.status(404).json({
          message: "No restaurant application found.",
        });
      }

      response.status(200).json({
        message: "Restaurant application fetched successfully.",
        restaurant,
      });
    } catch (error) {
      response.status(500).json({
        message: "Error getting restaurant application.",
        err: error.message,
      });
    }
  },
  updateMyRestaurantApplication: async (request, response) => {
    try {
      const userID = request.userID;

      const restaurant = await Restaurant.findOne({
        ownerId: userID,
      });

      if (!restaurant) {
        return response.status(404).json({
          message: "Restaurant application not found.",
        });
      }

      // Only rejected applications can be resubmitted
      if (restaurant.status !== "rejected") {
        return response.status(400).json({
          message: "Only rejected applications can be updated.",
        });
      }

      const {
        restaurantName,
        description,
        cuisine,
        phoneNumber,
        address,
        openingHours,
        deliveryTime,
        deliveryFee,
        minimumOrder,
      } = request.body;

      // ================= VALIDATION =================

      // Restaurant name
      if (!restaurantName || restaurantName.trim().length < 2) {
        return response.status(400).json({
          message: "Restaurant name must contain at least 2 characters.",
        });
      }

      // Phone number
      if (!phoneNumber || !/^[0-9]{10}$/.test(String(phoneNumber))) {
        return response.status(400).json({
          message: "Phone number must contain exactly 10 digits.",
        });
      }

      // Description
      if (!description || description.trim().length < 10) {
        return response.status(400).json({
          message: "Description must contain at least 10 characters.",
        });
      }

      // Delivery time
      if (!deliveryTime || Number(deliveryTime) <= 0) {
        return response.status(400).json({
          message: "Delivery time must be greater than 0.",
        });
      }

      // Delivery fee
      if (deliveryFee === undefined || Number(deliveryFee) < 0) {
        return response.status(400).json({
          message: "Delivery fee cannot be negative.",
        });
      }

      // Minimum order
      if (minimumOrder === undefined || Number(minimumOrder) < 0) {
        return response.status(400).json({
          message: "Minimum order cannot be negative.",
        });
      }

      // Basic fields
      restaurant.restaurantName = restaurantName ?? restaurant.restaurantName;

      restaurant.description = description ?? restaurant.description;

      restaurant.cuisine = cuisine ?? restaurant.cuisine;

      restaurant.phoneNumber = phoneNumber ?? restaurant.phoneNumber;

      restaurant.deliveryTime = deliveryTime ?? restaurant.deliveryTime;

      restaurant.deliveryFee = deliveryFee ?? restaurant.deliveryFee;

      restaurant.minimumOrder = minimumOrder ?? restaurant.minimumOrder;

      // Nested address
      if (address) {
        restaurant.address = {
          street: address.street ?? restaurant.address.street,
          city: address.city ?? restaurant.address.city,
          state: address.state ?? restaurant.address.state,
          pincode: address.pincode ?? restaurant.address.pincode,
          country: address.country ?? restaurant.address.country,
        };
      }

      // Nested opening hours
      if (openingHours) {
        restaurant.openingHours = {
          open: openingHours.open ?? restaurant.openingHours.open,
          close: openingHours.close ?? restaurant.openingHours.close,
        };
      }

      // New application
      restaurant.status = "pending";
      restaurant.rejectionReason = "";

      // Update logo if uploaded
      if (request.files?.restaurantLogo?.[0]) {
        restaurant.logo = request.files.restaurantLogo[0].path.replace(
          /\\/g,
          "/",
        );
      }

      // Update banner if uploaded
      if (request.files?.restaurantBanner?.[0]) {
        restaurant.banner = request.files.restaurantBanner[0].path.replace(
          /\\/g,
          "/",
        );
      }

      await restaurant.save();

      return response.status(200).json({
        message: "Restaurant application resubmitted successfully.",
        restaurant,
      });
    } catch (error) {
      // Duplicate phone number
      if (error.code === 11000) {
        return response.status(400).json({
          message:
            "Phone number is already registered with another restaurant.",
        });
      }

      // Mongoose validation error
      if (error.name === "ValidationError") {
        return response.status(400).json({
          message: "Invalid restaurant data.",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      return response.status(500).json({
        message: "Error updating restaurant application.",
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

      // ================= VALIDATION =================

      // Restaurant name
      if (restaurantName !== undefined && restaurantName.trim().length < 2) {
        return response.status(400).json({
          message: "Restaurant name must contain at least 2 characters.",
        });
      }

      // Phone number
      if (
        phoneNumber !== undefined &&
        !/^[0-9]{10}$/.test(String(phoneNumber))
      ) {
        return response.status(400).json({
          message: "Phone number must contain exactly 10 digits.",
        });
      }

      // Description
      if (description !== undefined && description.trim().length < 10) {
        return response.status(400).json({
          message: "Description must contain at least 10 characters.",
        });
      }

      // Delivery time
      if (deliveryTime !== undefined && Number(deliveryTime) <= 0) {
        return response.status(400).json({
          message: "Delivery time must be greater than 0.",
        });
      }

      // Delivery fee
      if (deliveryFee !== undefined && Number(deliveryFee) < 0) {
        return response.status(400).json({
          message: "Delivery fee cannot be negative.",
        });
      }

      // Minimum order
      if (minimumOrder !== undefined && Number(minimumOrder) < 0) {
        return response.status(400).json({
          message: "Minimum order cannot be negative.",
        });
      }

      // Cuisine
      if (
        cuisine !== undefined &&
        (!Array.isArray(cuisine) || cuisine.length === 0)
      ) {
        return response.status(400).json({
          message: "At least one cuisine is required.",
        });
      }

      // Address
      if (address !== undefined) {
        if (!address || typeof address !== "object") {
          return response.status(400).json({
            message: "Invalid address.",
          });
        }

        // Pincode
        if (
          address.pincode !== undefined &&
          !/^[0-9]{6}$/.test(String(address.pincode))
        ) {
          return response.status(400).json({
            message: "Pincode must contain exactly 6 digits.",
          });
        }
      }

      // Opening hours
      if (
        openingHours !== undefined &&
        (!openingHours || typeof openingHours !== "object")
      ) {
        return response.status(400).json({
          message: "Invalid opening hours.",
        });
      }

      // ================= UPDATE =================

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

      restaurant.description =
        description !== undefined ? description.trim() : restaurant.description;

      restaurant.phoneNumber = phoneNumber ?? restaurant.phoneNumber;

      restaurant.cuisine = cuisine ?? restaurant.cuisine;

      restaurant.address = address ?? restaurant.address;

      restaurant.openingHours = openingHours ?? restaurant.openingHours;

      restaurant.deliveryTime =
        deliveryTime !== undefined
          ? Number(deliveryTime)
          : restaurant.deliveryTime;

      restaurant.deliveryFee =
        deliveryFee !== undefined
          ? Number(deliveryFee)
          : restaurant.deliveryFee;

      restaurant.minimumOrder =
        minimumOrder !== undefined
          ? Number(minimumOrder)
          : restaurant.minimumOrder;

      restaurant.isOpen = isOpen ?? restaurant.isOpen;

      // ================= REJECTED → PENDING =================

      if (restaurant.status === "rejected") {
        restaurant.status = "pending";
        restaurant.rejectionReason = null;
      }

      await restaurant.save();

      response.status(200).json({
        message: "updated successfully",
        restaurant,
      });
    } catch (error) {
      // Duplicate phone number
      if (error.code === 11000) {
        return response.status(409).json({
          message:
            "Phone number is already registered with another restaurant.",
        });
      }

      // Mongoose validation error
      if (error.name === "ValidationError") {
        return response.status(400).json({
          message: "Invalid restaurant data.",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      return response.status(500).json({
        message: "error updating restaurant",
        err: error.message,
      });
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
