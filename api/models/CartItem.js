const db = require("../../config/db");

class CartItem {
  //Add a new item to the cart
  static async addItem(cartId, itemId) {
    try {
      const [result] = await db.execute(
        "INSERT INTO cart_items (cart_id,item_id) VALUES (?,?)",
        [cartId, itemId]
      );
      return result.insertId; //Return the new cart_item's ID
    } catch (error) {
      throw new Error("Error adding item to cart:" + error.message);
    }
  }

  // Fetch all items in a cart by cart ID
  static async getItemsByCartId(cartId) {
    try {
      const [rows] = await db.execute(
        `SELECT ci.cart_item_id, ci.quantity, i.item_id, i.item_name, i.item_price, i.item_image
       FROM cart_items ci
       JOIN item i ON ci.item_id = i.item_id
       WHERE ci.cart_id = ?`,
        [cartId]
      );
      return rows;
    } catch (error) {
      throw new Error("Error fetching cart items: " + error.message);
    }
  }

  //Delete an item from the cart
  static async deleteItem(cartItemId) {
    try {
      console.log("Executing DELETE query for cart_item_id:", cartItemId);

      // Execute the DELETE query
      const [result] = await db.execute(
        "DELETE FROM cart_items WHERE cart_item_id = ?",
        [cartItemId]
      );

      console.log("DELETE result:", result);
      return result.affectedRows; // Return affected rows count
    } catch (error) {
      console.error("Error executing DELETE query:", error.message);
      throw new Error("Error deleting item from cart: " + error.message);
    }
  }

  //update the item quantity
  static async updateItemQuantity(cartItemId, quantity) {
    try {
      console.log(
        "Executing UPDATE query for:",
        cartItemId,
        "with quantity:",
        quantity
      );

      const [result] = await db.execute(
        "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?",
        [quantity, cartItemId]
      );

      console.log("UPDATE Result:", result); // Log the result of the query
      return result.affectedRows; // Returns the number of rows affected
    } catch (error) {
      console.error("Error updating cart item:", error.message);
      throw new Error("Error updating cart item: " + error.message);
    }
  }
}

module.exports = CartItem;
