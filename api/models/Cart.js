const db = require("../../config/db");

class Cart {
  // Create a new cart for a user
  static async createCart(userId) {
    try {
      const [result] = await db.execute(
        "INSERT INTO cart (user_id) VALUES (?)",
        [userId]
      );
      return result.insertId; // Return the new cart's ID
    } catch (error) {
      throw new Error("Error creating cart: " + error.message);
    }
  }

  // Fetch cart by user ID
  static async getCartByUserId(userId) {
    try {
      const [result] = await db.execute(
        "SELECT * FROM cart WHERE user_id = ?",
        [userId]
      );
      return result.length ? result[0] : null; // If there's a cart, return the first one
    } catch (error) {
      throw new Error("Error fetching cart by user ID: " + error.message);
    }
  }
}

module.exports = Cart;
