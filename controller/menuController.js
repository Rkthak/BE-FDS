const Menu = require("../model/menu");
const Restaurant = require("../model/restaurant");

const menuController = {
  createMenu: async (request, response) => {
    try {
      const restaurantID = request.restaurantID;

      const {
        itemName,
        description,
        category,
        price,
        isVeg,
        nutrition,
        customizations,
      } = request.body;

      if (!request.file) {
        return response.status(400).json({ message: "dish image is required" });
      }

      if (price <= 0) {
        return response.status(400).json({
          message: "price must be greater than 0",
        });
      }

      if (itemName && itemName.length < 2) {
        return response.status(400).json({
          message: "item name must be contain minimum 2 characters",
        });
      }

      const newMenu = new Menu({
        itemName,
        description,
        category,
        price,
        isVeg: isVeg ?? true,
        nutrition: nutrition ? JSON.parse(nutrition) : {},
        customizations: customizations ? JSON.parse(customizations) : [],
        image: request.file.path.replace(/\\/g, "/"),
        restaurantId: restaurantID,
      });

      await newMenu.save();

      response.status(201).json({ message: "menu created successfully" });
    } catch (error) {
      response
        .status(500)
        .json({ message: "error creating menu", err: error.message });
    }
  },
  getRestaurantMenus: async (request, response) => {
    try {
      const { restaurantID } = request.params;

      const restaurant = await Restaurant.findById(restaurantID);

      if (!restaurant) {
        return response.status(404).json({
          message: "restaurant not found.",
        });
      }

      const menus = await Menu.find({
        restaurantId: restaurantID,
        isAvailable: true,
      }).select("-__v");

      response.status(200).json({
        message:
          menus.length < 1 ? "no menu available" : "menu fetched successfully",
        menus,
      });
    } catch (error) {
      response.status(500).json({
        message: "error getting restaurant menus.",
        err: error.message,
      });
    }
  },
  getMenuById: async (request, response) => {
    try {
      const { restaurantID, menuID } = request.params;

      const menu = await Menu.findOne({
        _id: menuID,
        restaurantId: restaurantID,
        isAvailable: true,
      }).select("-__v");

      if (!menu) {
        return response.status(404).json({
          message: "menu not found.",
        });
      }

      response.status(200).json(menu);
    } catch (error) {
      response.status(500).json({
        message: "error getting menu.",
        err: error.message,
      });
    }
  },
  getMyMenu: async (request, response) => {
    try {
      const restaurantID = request.restaurantID;

      const menus = await Menu.find({
        restaurantId: restaurantID,
      }).select("-__v");
      response.status(200).json({
        message:
          menus.length < 1
            ? "you have no menu available"
            : "menu fetched successfully",
        menus,
      });
    } catch (error) {
      response.status(500).json({
        message: "error getting your menu.",
        err: error.message,
      });
    }
  },
  getMyMenuById: async (request, response) => {
    try {
      const { menuID } = request.params;
      const restaurantID = request.restaurantID;

      const menu = await Menu.findOne({
        _id: menuID,
        restaurantId: restaurantID,
      }).select("-__v");

      if (!menu) {
        return response.status(404).json({
          message: "menu not found.",
        });
      }

      response.status(200).json(menu);
    } catch (error) {
      response.status(500).json({
        message: "error getting menu.",
        err: error.message,
      });
    }
  },
  updateMenu: async (request, response) => {
    try {
      const { menuID } = request.params;
      const restaurantID = request.restaurantID;

      const {
        itemName,
        description,
        category,
        price,
        isVeg,
        nutrition,
        customizations,
        isAvailable,
      } = request.body;

      const menu = await Menu.findOne({
        _id: menuID,
        restaurantId: restaurantID,
      });

      if (!menu) {
        return response.status(404).json({
          message: "menu not found.",
        });
      }

      if (itemName && itemName.trim().length < 2) {
        return response.status(400).json({
          message: "item name must contain at least 2 characters.",
        });
      }

      if (price && price <= 0) {
        return response.status(400).json({
          message: "price must be greater than 0.",
        });
      }

      menu.itemName = itemName ?? menu.itemName;
      menu.description = description ?? menu.description;
      menu.category = category ?? menu.category;
      menu.price = price ?? menu.price;
      menu.isVeg = isVeg ?? menu.isVeg;
      menu.isAvailable = isAvailable ?? menu.isAvailable;

      if (nutrition) {
        menu.nutrition =
          typeof nutrition === "string" ? JSON.parse(nutrition) : nutrition;
      }

      if (customizations) {
        menu.customizations =
          typeof customizations === "string"
            ? JSON.parse(customizations)
            : customizations;
      }

      if (request.file) {
        menu.image = request.file.path.replace(/\\/g, "/");
      }

      await menu.save();

      response.status(200).json({
        message: "menu updated successfully.",
      });
    } catch (error) {
      response.status(500).json({
        message: "error updating menu.",
        err: error.message,
      });
    }
  },
  deleteMenu: async (request, response) => {
    try {
      const { menuID } = request.params;
      const restaurantID = request.restaurantID;
      const menu = await Menu.findOne({
        _id: menuID,
        restaurantId: restaurantID,
      });

      if (!menu) {
        return response.status(404).json({
          message: "menu not found.",
        });
      }

      await menu.deleteOne();

      response.status(200).json({
        message: "menu deleted successfully.",
      });
    } catch (error) {
      response.status(500).json({
        message: "error deleting menu.",
        err: error.message,
      });
    }
  },
};

module.exports = menuController;
