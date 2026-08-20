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

      // ================= IMAGE =================
      if (!request.file) {
        return response.status(400).json({
          message: "Dish image is required.",
        });
      }

      // ================= ITEM NAME =================
      if (!itemName || typeof itemName !== "string") {
        return response.status(400).json({
          message: "Item name is required.",
        });
      }

      if (itemName.trim().length < 2) {
        return response.status(400).json({
          message: "Item name must contain at least 2 characters.",
        });
      }

      if (itemName.trim().length > 100) {
        return response.status(400).json({
          message: "Item name cannot exceed 100 characters.",
        });
      }

      // ================= CATEGORY =================
      if (!category || typeof category !== "string") {
        return response.status(400).json({
          message: "Category is required.",
        });
      }

      if (!category.trim()) {
        return response.status(400).json({
          message: "Category cannot be empty.",
        });
      }

      // ================= PRICE =================
      const menuPrice = Number(price);

      if (price === undefined || price === "" || !Number.isFinite(menuPrice)) {
        return response.status(400).json({
          message: "Valid price is required.",
        });
      }

      if (menuPrice <= 0) {
        return response.status(400).json({
          message: "Price must be greater than 0.",
        });
      }

      // ================= DESCRIPTION =================
      if (description && typeof description !== "string") {
        return response.status(400).json({
          message: "Description must be a string.",
        });
      }

      // ================= IS VEG =================
      let vegetarian = true;

      if (isVeg !== undefined) {
        if (isVeg !== "true" && isVeg !== "false") {
          return response.status(400).json({
            message: "Invalid vegetarian value.",
          });
        }

        vegetarian = isVeg === "true";
      }

      // ================= NUTRITION =================
      let parsedNutrition = {};

      if (nutrition) {
        try {
          parsedNutrition = JSON.parse(nutrition);
        } catch (error) {
          return response.status(400).json({
            message: "Invalid nutrition data.",
          });
        }

        const fields = ["calories", "protein", "carbs", "fat"];

        for (const field of fields) {
          if (parsedNutrition[field] !== undefined) {
            const value = Number(parsedNutrition[field]);

            if (!Number.isFinite(value) || value < 0) {
              return response.status(400).json({
                message: `${field} must be a valid non-negative number.`,
              });
            }

            parsedNutrition[field] = value;
          }
        }
      }

      // ================= CUSTOMIZATIONS =================
      let parsedCustomizations = [];

      if (customizations) {
        try {
          parsedCustomizations = JSON.parse(customizations);
        } catch (error) {
          return response.status(400).json({
            message: "Invalid customization data.",
          });
        }

        if (!Array.isArray(parsedCustomizations)) {
          return response.status(400).json({
            message: "Customizations must be an array.",
          });
        }

        for (const item of parsedCustomizations) {
          if (!item.name || typeof item.name !== "string") {
            return response.status(400).json({
              message: "Customization name is required.",
            });
          }

          if (!item.name.trim()) {
            return response.status(400).json({
              message: "Customization name cannot be empty.",
            });
          }

          const extraPrice = Number(item.extraPrice);

          if (!Number.isFinite(extraPrice) || extraPrice < 0) {
            return response.status(400).json({
              message: "Customization price must be 0 or greater.",
            });
          }

          item.name = item.name.trim();
          item.extraPrice = extraPrice;
        }
      }

      // ================= CREATE MENU =================
      const newMenu = new Menu({
        itemName: itemName.trim(),
        description: description?.trim() || "",
        category: category.trim(),
        price: menuPrice,
        isVeg: vegetarian,
        nutrition: parsedNutrition,
        customizations: parsedCustomizations,
        image: request.file.path.replace(/\\/g, "/"),
        restaurantId: restaurantID,
      });

      await newMenu.save();

      return response.status(201).json({
        message: "Menu created successfully.",
      });
    } catch (error) {
      // Mongoose validation error
      if (error.name === "ValidationError") {
        return response.status(400).json({
          message: "Invalid menu data.",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }
      return response.status(500).json({
        message: "Error creating menu.",
        err: error.message,
      });
    }
  },
  getAllMenus: async (request, response) => {
    try {
      const approvedRestaurants = await Restaurant.find({
        status: "approved",
      }).select("_id");

      const restaurantIDs = approvedRestaurants.map(
        (restaurant) => restaurant._id,
      );

      const menu = await Menu.find({
        isAvailable: true,
        restaurantId: { $in: restaurantIDs },
      })
        .select("-__v")
        .populate(
          "restaurantId",
          "restaurantName slug logo phoneNumber address isOpen",
        );

      if (menu.length < 1) {
        return response.status(404).json({
          message: "menu is not available",
        });
      }

      response.status(200).json(menu);
    } catch (error) {
      response.status(500).json({
        message: "error getting all menus",
        err: error.message,
      });
    }
  },
  getMenuById: async (request, response) => {
    try {
      const { menuID } = request.params;

      const menu = await Menu.findOne({
        _id: menuID,
        isAvailable: true,
      })
        .select("-__v")
        .populate({
          path: "restaurantId",
          match: { status: "approved" },
          select: "restaurantName slug logo phoneNumber address isOpen",
        });

      if (!menu || !menu.restaurantId) {
        return response.status(404).json({
          message: "menu is not available",
        });
      }

      response.status(200).json(menu);
    } catch (error) {
      response.status(500).json({
        message: "error getting menu",
        err: error.message,
      });
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
  getRestaurantMenuById: async (request, response) => {
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
          message: "Menu not found.",
        });
      }

      // ================= ITEM NAME =================
      if (itemName !== undefined) {
        if (typeof itemName !== "string") {
          return response.status(400).json({
            message: "Item name must be a string.",
          });
        }

        if (itemName.trim().length < 2) {
          return response.status(400).json({
            message: "Item name must contain at least 2 characters.",
          });
        }

        if (itemName.trim().length > 50) {
          return response.status(400).json({
            message: "Item name cannot exceed 50 characters.",
          });
        }

        menu.itemName = itemName.trim();
      }

      // ================= DESCRIPTION =================
      if (description !== undefined) {
        if (typeof description !== "string") {
          return response.status(400).json({
            message: "Description must be a string.",
          });
        }

        if (description.length > 500) {
          return response.status(400).json({
            message: "Description cannot exceed 500 characters.",
          });
        }

        menu.description = description.trim();
      }

      // ================= CATEGORY =================
      if (category !== undefined) {
        if (typeof category !== "string") {
          return response.status(400).json({
            message: "Category must be a string.",
          });
        }

        if (!category.trim()) {
          return response.status(400).json({
            message: "Category cannot be empty.",
          });
        }

        menu.category = category.trim();
      }

      // ================= PRICE =================
      if (price !== undefined && price !== "") {
        const menuPrice = Number(price);

        if (!Number.isFinite(menuPrice)) {
          return response.status(400).json({
            message: "Price must be a valid number.",
          });
        }

        if (menuPrice <= 0) {
          return response.status(400).json({
            message: "Price must be greater than 0.",
          });
        }

        menu.price = menuPrice;
      }

      // ================= IS VEG =================
      if (isVeg !== undefined) {
        if (isVeg !== "true" && isVeg !== "false") {
          return response.status(400).json({
            message: "Invalid vegetarian value.",
          });
        }

        menu.isVeg = isVeg === "true";
      }

      // ================= IS AVAILABLE =================
      if (isAvailable !== undefined) {
        if (isAvailable !== "true" && isAvailable !== "false") {
          return response.status(400).json({
            message: "Invalid availability value.",
          });
        }

        menu.isAvailable = isAvailable === "true";
      }

      // ================= NUTRITION =================
      if (nutrition !== undefined && nutrition !== "") {
        let parsedNutrition;

        try {
          parsedNutrition =
            typeof nutrition === "string" ? JSON.parse(nutrition) : nutrition;
        } catch (error) {
          return response.status(400).json({
            message: "Invalid nutrition data.",
          });
        }

        if (
          typeof parsedNutrition !== "object" ||
          parsedNutrition === null ||
          Array.isArray(parsedNutrition)
        ) {
          return response.status(400).json({
            message: "Nutrition must be an object.",
          });
        }

        const nutritionFields = ["calories", "protein", "carbs", "fat"];

        for (const field of nutritionFields) {
          if (parsedNutrition[field] !== undefined) {
            const value = Number(parsedNutrition[field]);

            if (!Number.isFinite(value) || value < 0) {
              return response.status(400).json({
                message: `${field} must be a valid non-negative number.`,
              });
            }

            parsedNutrition[field] = value;
          }
        }

        menu.nutrition = parsedNutrition;
      }

      // ================= CUSTOMIZATIONS =================
      if (customizations !== undefined && customizations !== "") {
        let parsedCustomizations;

        try {
          parsedCustomizations =
            typeof customizations === "string"
              ? JSON.parse(customizations)
              : customizations;
        } catch (error) {
          return response.status(400).json({
            message: "Invalid customization data.",
          });
        }

        if (!Array.isArray(parsedCustomizations)) {
          return response.status(400).json({
            message: "Customizations must be an array.",
          });
        }

        for (const item of parsedCustomizations) {
          if (!item || typeof item.name !== "string") {
            return response.status(400).json({
              message: "Customization name is required.",
            });
          }

          if (!item.name.trim()) {
            return response.status(400).json({
              message: "Customization name cannot be empty.",
            });
          }

          const extraPrice = Number(item.extraPrice);

          if (
            item.extraPrice === undefined ||
            item.extraPrice === "" ||
            !Number.isFinite(extraPrice)
          ) {
            return response.status(400).json({
              message: "Customization price must be a valid number.",
            });
          }

          if (extraPrice < 0) {
            return response.status(400).json({
              message: "Customization price cannot be negative.",
            });
          }

          item.name = item.name.trim();
          item.extraPrice = extraPrice;
        }

        menu.customizations = parsedCustomizations;
      }

      // ================= IMAGE =================
      if (request.file) {
        menu.image = request.file.path.replace(/\\/g, "/");
      }

      // ================= SAVE =================
      await menu.save();

      return response.status(200).json({
        message: "Menu updated successfully.",
      });
    } catch (error) {
      // ================= MONGOOSE VALIDATION =================
      if (error.name === "ValidationError") {
        return response.status(400).json({
          message: "Invalid menu data.",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }
      return response.status(500).json({
        message: "Error updating menu.",
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
