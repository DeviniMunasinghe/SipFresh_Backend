const express = require("express");
const cartController = require("../controllers/cart-controller");
const { protect } = require("../middleware/auth-middleware");
const router = express.Router();

// Add an item to the cart (Protected)
router.post("/add", protect, cartController.addItemToCart);

// Get all items in the user's cart (Protected)
router.get("/get-all", protect, cartController.getCartItems);

// Remove an item from the cart (Protected)
router.delete("/delete/:cartItemId", protect, cartController.deleteCartItem);

// Update the quantity of a cart item (Protected)
router.put("/update/:cartItemId", protect, cartController.updateCartItem);

module.exports = router;
