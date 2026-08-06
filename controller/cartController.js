const Cart = require("../model/cart");
const Menu = require("../model/menu");

const cartController = {
  addToCart: async (request, response) => {
    try {
      const userID = request.userID;
      const { menuID, quantity = 1 } = request.body;

      const menu = await Menu.findById(menuID);

      if (!menu) {
        return response.status(404).json({
          message: "menu not found",
        });
      }

      if (!menu.isAvailable) {
        return response.status(400).json({
          message: "menu is not available",
        });
      }

      let cart = await Cart.findOne({
        userId: userID,
      });

      if (!cart) {
        cart = new Cart({
          userId: userID,
          restaurantId: menu.restaurantId,
          items: [
            {
              menuId: menuID,
              quantity,
            },
          ],
          totalAmount: menu.price * quantity,
        });

        await cart.save();

        return response.status(201).json({
          message: "item added to cart",
          cart,
        });
      }

      // check different restaurant
      if (cart.restaurantId.toString() !== menu.restaurantId.toString()) {
        return response.status(400).json({
          message: "cart already contains items from another restaurant",
        });
      }

      const existingItem = cart.items.find(
        (item) => item.menuId.toString() === menuID,
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          menuId: menuID,
          quantity,
        });
      }

      cart.totalAmount += menu.price * quantity;

      await cart.save();

      response.status(200).json({
        message: "item added to cart",
        cart,
      });
    } catch (error) {
      response.status(500).json({
        message: "error adding item to cart",
        err: error.message,
      });
    }
  },

  getCart: async (request, response) => {
    try {
      const userID = request.userID;

      const cart = await Cart.findOne({
        userId: userID,
      })
        .populate({
          path: "items.menuId",
          select: "itemName description price image isVeg",
        })
        .populate("restaurantId", "restaurantName slug");

      if (!cart) {
        return response.status(404).json({
          message: "cart is empty",
        });
      }

      response.status(200).json(cart);
    } catch (error) {
      response.status(500).json({
        message: "error getting cart",
        err: error.message,
      });
    }
  },

  updateCartItem: async (request, response) => {
    try {
      const userID = request.userID;
      const { menuID, quantity } = request.body;

      if (quantity < 1) {
        return response.status(400).json({
          message: "quantity must be greater than 0",
        });
      }

      const cart = await Cart.findOne({
        userId: userID,
      });

      if (!cart) {
        return response.status(404).json({
          message: "cart not found",
        });
      }

      const item = cart.items.find((item) => item.menuId.toString() === menuID);

      if (!item) {
        return response.status(404).json({
          message: "item not found in cart",
        });
      }

      const menu = await Menu.findById(menuID);

      cart.totalAmount =
        cart.totalAmount - menu.price * item.quantity + menu.price * quantity;

      item.quantity = quantity;

      await cart.save();

      response.status(200).json({
        message: "cart updated",
        cart,
      });
    } catch (error) {
      response.status(500).json({
        message: "error updating cart",
        err: error.message,
      });
    }
  },

  removeCartItem: async (request, response) => {
    try {
      const userID = request.userID;
      const { menuID } = request.body;

      const cart = await Cart.findOne({
        userId: userID,
      });

      if (!cart) {
        return response.status(404).json({
          message: "cart not found",
        });
      }

      const item = cart.items.find((item) => item.menuId.toString() === menuID);

      if (!item) {
        return response.status(404).json({
          message: "item not found",
        });
      }

      const menu = await Menu.findById(menuID);

      cart.totalAmount -= menu.price * item.quantity;

      cart.items.pull({
        menuId: menuID,
      });

      await cart.save();

      response.status(200).json({
        message: "item removed from cart",
      });
    } catch (error) {
      response.status(500).json({
        message: "error removing item",
        err: error.message,
      });
    }
  },

  clearCart: async (request, response) => {
    try {
      const userID = request.userID;

      await Cart.findOneAndDelete({
        userId: userID,
      });

      response.status(200).json({
        message: "cart cleared",
      });
    } catch (error) {
      response.status(500).json({
        message: "error clearing cart",
        err: error.message,
      });
    }
  },
};

module.exports = cartController;
