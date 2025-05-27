const db = require("../../config/db");
const Cart = require("../models/Cart"); // Import Cart model
const CartItem = require("../models/CartItem"); // Import CartItem model

// Add item to the cart
exports.addItemToCart = async (req, res) => {
  const { item_id } = req.body;
  const user_id = req.user.user_id; // Assuming user info is available from auth middleware

  // Log the values for debugging
  console.log("item_id:", item_id);
  console.log("user_id:", user_id);

  // Validate input
  if (!item_id) {
    return res.status(400).json({ message: "Item ID is required." });
  }

  if (!user_id) {
    return res.status(400).json({ message: "User ID is required." });
  }

  const quantity = 1;

  try {
    // First, check if a cart exists for the user. If not, create one
    const [userCart] = await db.execute(
      "SELECT cart_id FROM cart WHERE user_id = ?",
      [user_id]
    );

    let cart_id;
    if (userCart.length === 0) {
      // If the user doesn't have a cart, create one
      const [newCart] = await db.execute(
        "INSERT INTO cart (user_id, added_at) VALUES (?, NOW())",
        [user_id]
      );
      cart_id = newCart.insertId; // Get the newly created cart's ID
    } else {
      // If the user already has a cart, use its cart_id
      cart_id = userCart[0].cart_id;
    }

    // Check if the item is already in the cart
    const [existingCartItem] = await db.execute(
      "SELECT * FROM cart_items WHERE cart_id = ? AND item_id = ?",
      [cart_id, item_id]
    );

    if (existingCartItem.length > 0) {
      await db.execute(
        "UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ? AND item_id = ?",
        [quantity, cart_id, item_id]
      );
      return res
        .status(200)
        .json({ message: "Item quantity updated in the cart." });
    }

    // If item does not exist, add it to the cart
    await db.execute(
      "INSERT INTO cart_items (cart_id, item_id,quantity) VALUES (?, ?,?)",
      [cart_id || null, item_id || null, quantity || null]
    );

    res.status(201).json({ message: "Item added to cart successfully." });
  } catch (error) {
    console.error("Error adding item to cart:", error.message);
    res
      .status(500)
      .json({ message: "Failed to add item to cart", error: error.message });
  }
};

// Get all items in the user's cart
exports.getCartItems = async (req, res) => {
  try {
    const userId = req.user.user_id;
    console.log("Fetching cart items for userId:", userId);

    // Fetch the cart items from the database for the user
    const cart = await Cart.getCartByUserId(userId);
    console.log("Cart found:", cart);

    if (!cart) {
      return res.status(404).json({ message: "No Cart found this user" });
    }

    const cartItems = await CartItem.getItemsByCartId(cart.cart_id);

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({ message: "No items in cart" });
    }

    // Send the cart items in the response
    res.status(200).json({ items: cartItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const cartItemId = req.params.cartItemId;
    console.log("Deleting Cart Item with ID:", cartItemId);

    if (!cartItemId) {
      console.log("No Cart Item ID provided.");
      return res.status(400).json({ message: "Cart Item ID is required." });
    }

    // Perform the deletion
    const affectedRows = await CartItem.deleteItem(cartItemId);
    console.log("Delete query result:", affectedRows);

    // Check if the deletion was successful
    if (affectedRows === 0) {
      console.log("Cart item not found.");
      return res.status(404).json({ message: "Cart item not found." });
    }

    console.log("Item removed from cart successfully.");
    return res
      .status(200)
      .json({ message: "Item removed from cart successfully." });
  } catch (error) {
    console.error("Error deleting item from cart:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const cartItemId = req.params.cartItemId; // Get cart item ID from URL params
    const { quantity } = req.body; // Get the new quantity from request body

    // Log the received values
    console.log("Received cartItemId:", cartItemId);
    console.log("Received quantity:", quantity);

    // Input validation
    if (!cartItemId) {
      return res.status(400).json({ message: "Cart Item ID is required." });
    }
    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({ message: "Valid quantity is required." });
    }

    // Execute the update query
    const affectedRows = await CartItem.updateItemQuantity(
      cartItemId,
      quantity
    );

    console.log("Affected Rows:", affectedRows); // Log query result

    if (affectedRows === 0) {
      console.log("Cart item not found for ID:", cartItemId); // Debugging log
      return res.status(404).json({ error: { message: "Not found" } });
    }

    console.log("Cart item updated successfully.");
    return res.status(200).json({ message: "Cart item updated successfully." });
  } catch (error) {
    console.error("Error updating cart item:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
