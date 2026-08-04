const Restaurant = require("../model/restaurant");
const User = require("../model/user");
const mongoose = require("mongoose");
const { updateMyRestaurant } = require("./restaurantController");
const generateSlug = require("../utils/generateSlug");

const adminController = {
  approveRestaurant: async (request, response) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const { status, rejectionReason } = request.body;
      const { restaurantID } = request.params;

      const restaurant =
        await Restaurant.findById(restaurantID).session(session);

      if (!restaurant) {
        await session.abortTransaction();
        return response.status(404).json({ message: "restaurant not found" });
      }

      if (restaurant.status === status) {
        await session.abortTransaction();
        return response
          .status(400)
          .json({ message: `restaurant already have ${status} status` });
      }

      restaurant.status = status;
      restaurant.rejectionReason = rejectionReason || "";

      await restaurant.save({ session });

      // Update User Role only if approved
      if (status === "approved") {
        await User.findByIdAndUpdate(
          restaurant.ownerId,
          {
            role: "restaurant",
          },
          { session },
        );
      }

      await session.commitTransaction();

      response.status(200).json({
        message: "restaurant updated successfully!",
        restaurant,
      });
    } catch (error) {
      await session.abortTransaction();

      response.status(500).json({
        message: "error updating status of restaurant.",
        err: error.message,
      });
    } finally {
      session.endSession();
    }
  },
  getRestaurants: async (request, response) => {
    try {
      const user = request.user;
      console.log(user);
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
      const { restaurantID } = request.params;

      const restaurant = await Restaurant.findById(restaurantID)
        .select("-__v")
        .populate("ownerId", "userName email profileImage");

      if (!restaurant) {
        return response.status(400).json({ message: "restaurant not found" });
      }

      response.status(200).json({ restaurant });
    } catch (error) {
      return response
        .status(500)
        .json({ message: "error getting restaurant", err: error.message });
    }
  },
  deleteRestaurant: async (request, response) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const { restaurantID } = request.params;

      const restaurant =
        await Restaurant.findById(restaurantID).session(session);

      if (!restaurant) {
        await session.abortTransaction();
        return response.status(404).json({ message: "no restaurant found" });
      }

      await restaurant.deleteOne({ session });

      const totalRestaurants = await Restaurant.countDocuments({
        ownerId: restaurant.ownerId,
      }).session(session);

      if (totalRestaurants === 0) {
        await User.findByIdAndUpdate(
          restaurant.ownerId,
          {
            role: "user",
          },
          { session },
        );
      }

      await session.commitTransaction();

      response
        .status(200)
        .json({ message: "deleted successfully", restaurantID });
    } catch (error) {
      await session.abortTransaction();
      return response
        .status(500)
        .json({ message: "error deleting restaurant", err: error.message });
    } finally {
      session.endSession();
    }
  },
  updateRestaurant: async (request, response) => {
    try {
      const { restaurantID } = request.params;

      const { restaurantName, isOpen, status } = request.body;

      const restaurant = await Restaurant.findById(restaurantID);

      if (!restaurant) {
        return response.status(404).json({
          message: "no restaurant found",
        });
      }

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

      if (restaurant.status === status) {
        await session.abortTransaction();
        return response
          .status(400)
          .json({ message: `restaurant already have ${status} status` });
      }
      restaurant.isOpen = isOpen ?? restaurant.isOpen;
      restaurant.status = status ?? restaurant.status;

      await restaurant.save();

      response.status(200).json({ message: "restaurant updated sucessfully" });
    } catch (error) {
      response
        .status(500)
        .json({ message: "error updating restaurant", err: error.message });
    }
  },
};

module.exports = adminController;
