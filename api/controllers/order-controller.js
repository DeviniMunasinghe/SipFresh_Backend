const db = require("../../config/db");
const { sendEmail } = require("../../utils/email-utils");

exports.transferSelectedItemsToCheckout = async (req, res) => {
  const { selectedCartItemIds } = req.body;
  const userId = req.user.user_id;

  console.log("Incoming request body:", req.body);
  console.log("User ID:", userId);

  if (!Array.isArray(selectedCartItemIds) || selectedCartItemIds.length === 0) {
    return res.status(400).json({ error: "No items selected for checkout" });
  }

  console.log("Selected Cart Item IDs:", selectedCartItemIds);

  try {
    // Create placeholders for each cart_item_id
    const placeholders = selectedCartItemIds.map(() => "?").join(",");

    // Update query with placeholders and userId at the end
    const updateQuery = `
      UPDATE cart_items
      SET selected = 1
      WHERE cart_item_id IN (${placeholders})
      AND cart_id IN (SELECT cart_id FROM cart WHERE user_id = ?)
    `;

    // Execute update query with spread params (all selectedCartItemIds + userId)
    console.log("Executing query to update selected items:", updateQuery, [
      ...selectedCartItemIds,
      userId,
    ]);
    await db.execute(updateQuery, [...selectedCartItemIds, userId]);

    // Now fetch all selected items for this user
    const [selectedItems] = await db.execute(
      `SELECT ci.cart_item_id, ci.quantity, ci.item_id
   FROM cart_items ci 
   JOIN cart c ON ci.cart_id = c.cart_id 
   WHERE ci.selected = 1 AND c.user_id = ? AND ci.is_deleted = 0`,
      [userId]
    );

    console.log("Selected Items Retrieved:", selectedItems);

    if (selectedItems.length === 0) {
      console.log("No items found for the provided IDs.");
      return res.status(404).json({
        error: "Selected items not found in the cart or have been deleted.",
      });
    }

    return res.status(200).json({ items: selectedItems });
  } catch (error) {
    console.error(
      "Error while transferring selected items to checkout:",
      error
    );
    return res
      .status(500)
      .json({ error: "Failed to transfer selected items to checkout" });
  }
};

// Fetch selected items in checkout
exports.getSelectedItemsInCheckout = async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [selectedItems] = await db.execute(
      `SELECT ci.cart_item_id, ci.quantity, ci.item_id
   FROM cart_items ci 
   JOIN cart c ON ci.cart_id = c.cart_id 
   WHERE ci.selected = 1 AND c.user_id = ? AND ci.is_deleted = 0`,
      [userId]
    );

    if (selectedItems.length === 0) {
      return res
        .status(404)
        .json({ error: "No selected items found in checkout." });
    }

    res.json({ items: selectedItems });
  } catch (error) {
    console.error("Error fetching selected items in checkout:", error);
    res.status(500).json({ error: "Failed to fetch selected items." });
  }
};

// Remove selected items from checkout and return them to the cart as unselected
exports.removeItemsFromCheckout = async (req, res) => {
  const selectedCartItemId = req.params.selectedCartItemId;

  const userId = req.user.user_id;

  // Validate input
  if (!selectedCartItemId) {
    return res
      .status(400)
      .json({ message: "No item provided for removal from checkout." });
  }

  try {
    console.log(
      "Removing item from checkout:",
      selectedCartItemId,
      "for user ID:",
      userId
    );

    // Update the `selected` status of the items to `0` (unselected)
    const query = `
      UPDATE cart_items
      SET selected = 0
      WHERE cart_item_id =?
        AND cart_id IN (SELECT cart_id FROM cart WHERE user_id = ?)
        AND selected = 1
    `;

    const [result] = await db.execute(query, [selectedCartItemId, userId]);

    // Check if any rows were affected (i.e., items were actually updated)
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No selected items found for removal." });
    }

    // Respond with a success message
    console.log("Item removed from checkout and marked as unselected.");
    res.status(200).json({
      message:
        "Items successfully removed from checkout and marked as unselected.",
    });
  } catch (error) {
    console.error("Error while removing items from checkout:", error.message);
    res.status(500).json({
      message: "Failed to remove items from checkout.",
      error: error.message,
    });
  }
};

// Helper Function
const calculateSummaryFromCartItems = (cartItems) => {
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.item_price) * item.quantity,
    0
  );

  const discount = totalAmount * 0.1;
  const finalAmount = totalAmount - discount;

  return {
    totalAmount: totalAmount.toFixed(2),
    discountAmount: discount.toFixed(2),
    finalAmount: finalAmount.toFixed(2),
  };
};

exports.calculateOrderSummary = async (req, res) => {
  try {
    const userId = req.user.user_id;
    let { selectedCartItemIds } = req.body;

    console.log("User authenticated:", req.user);
    console.log("Received selectedCartItemIds:", selectedCartItemIds);

    // Validate input
    if (!selectedCartItemIds) {
      return res.status(400).json({ error: "selectedCartItemIds is required" });
    }

    // Convert to array if string
    if (typeof selectedCartItemIds === "string") {
      selectedCartItemIds = selectedCartItemIds
        .split(",")
        .map((id) => id.trim());
    }

    if (!Array.isArray(selectedCartItemIds)) {
      return res
        .status(400)
        .json({ error: "selectedCartItemIds must be an array" });
    }

    //Get user's cart_id
    const [cartRows] = await db.execute(
      "SELECT cart_id FROM cart WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (cartRows.length === 0) {
      return res.status(400).json({ error: "Cart not found for user" });
    }

    const cartId = cartRows[0].cart_id;

    // Get selected cart items with item price
    const placeholders = selectedCartItemIds.map(() => "?").join(",");
    const [cartItems] = await db.execute(
      `
        SELECT ci.*, i.item_price
        FROM cart_items ci
        JOIN item i ON ci.item_id = i.item_id
        WHERE ci.cart_item_id IN (${placeholders}) AND ci.cart_id = ? AND ci.is_deleted = 0
      `,
      [...selectedCartItemIds, cartId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ error: "No cart items found" });
    }

    const summary = calculateSummaryFromCartItems(cartItems);

    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error in calculateOrderSummary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get order summary for selected items (GET method)
exports.getOrderSummary = async (req, res) => {
  const { selectedCartItemIds } = req.query;
  console.log("Received selectedCartItemIds:", selectedCartItemIds);

  if (
    !selectedCartItemIds ||
    !Array.isArray(JSON.parse(selectedCartItemIds)) ||
    JSON.parse(selectedCartItemIds).length === 0
  ) {
    console.log("No items selected condition triggered.");
    return res.status(400).json({ error: "No items selected" });
  }

  try {
    const cartItemIds = JSON.parse(selectedCartItemIds);

    const placeholders = cartItemIds.map(() => "?").join(",");

    // Fetch selected items from the cart_items table, including item details from the items table
    const [selectedItems] = await db.execute(
      `SELECT ci.cart_item_id, ci.quantity, itm.item_price, itm.item_name
       FROM cart_items ci
       JOIN item itm ON ci.item_id = itm.item_id
       WHERE ci.cart_item_id IN (${placeholders}) AND ci.is_deleted = 0`,
      cartItemIds
    );

    console.log("Selected items from database:", selectedItems);

    if (selectedItems.length === 0) {
      return res
        .status(404)
        .json({ error: "Selected items not found or already deleted" });
    }

    // Check for any active promotion
    const [promotion] = await db.execute(
      `SELECT pr.discount_percentage 
       FROM promotion p
       JOIN promotion_rule pr ON p.promotion_id = pr.promotion_id
       WHERE CURDATE() BETWEEN p.start_date AND p.end_date 
       LIMIT 1`
    );

    // Set discount percentage (0 if no promotion is found)
    const discountPercentage = promotion.length
      ? promotion[0].discount_percentage
      : 0;

    let totalAmount = 0;
    let totalQuantity = 0;

    // Calculate the total amount, total quantity, and total discount
    selectedItems.forEach((item) => {
      const quantity = item.quantity ?? 1; // Default to 1 if quantity is null
      const { item_price } = item;
      totalAmount += quantity * item_price;
      totalQuantity += quantity;
    });

    // Calculate discount amount based on the totalAmount
    const discountAmount = (totalAmount * discountPercentage) / 100;
    const finalAmount = totalAmount - discountAmount;

    console.log("Calculated Order Summary:", {
      totalAmount,
      discountAmount,
      finalAmount,
    });

    // Send the calculated order summary as a response
    return res.json({
      totalAmount,
      discountAmount,
      finalAmount,
      totalQuantity,
    });
  } catch (err) {
    console.error("Error while calculating order summary:", err);
    return res.status(500).json({ error: "Failed to calculate order summary" });
  }
};

//place an order
exports.placeOrder = async (req, res) => {
  const {
    selectedCartItemIds,
    first_name,
    last_name,
    address,
    city,
    postal_code,
    phone_number,
    cart_id,
  } = req.body;
  const userId = req.user.user_id;
  const userEmail = req.user.email;

  if (
    !cart_id ||
    !selectedCartItemIds ||
    !Array.isArray(selectedCartItemIds) ||
    selectedCartItemIds.length === 0
  ) {
    return res
      .status(400)
      .json({ error: "Cart ID and selected item IDs are required." });
  }

  if (
    !first_name ||
    !last_name ||
    !address ||
    !city ||
    !postal_code ||
    !phone_number
  ) {
    return res
      .status(400)
      .json({ error: "All delivery details must be provided" });
  }

  let connection;
  try {
    console.log("Placing order for user:", userId);

    connection = await db.getConnection();
    await connection.beginTransaction();
    console.log("Transaction started.");

    const placeholders = selectedCartItemIds.map(() => "?").join(",");

    console.log("Placing order for user:", userId);
    console.log("Selected Cart Item IDs:", selectedCartItemIds);
    console.log("Cart ID:", cart_id);

    const [items] = await connection.execute(
      `SELECT ci.item_id, ci.quantity, itm.item_price 
       FROM cart_items ci 
       JOIN cart c ON ci.cart_id = c.cart_id 
       JOIN item itm ON ci.item_id = itm.item_id 
       WHERE ci.cart_item_id IN (${placeholders}) 
         AND ci.cart_id = ? 
         AND ci.is_deleted = 0 
         AND ci.selected = 1 
         AND c.user_id = ?`,
      [...selectedCartItemIds, cart_id, userId]
    );

    console.log("Fetched items for order:", items);

    // Validate quantities
    const invalidItems = items.filter(
      (item) => item.quantity === null || item.quantity <= 0
    );
    if (invalidItems.length > 0) {
      console.warn(
        "Items with invalid or missing quantities found:",
        invalidItems
      );
      return res
        .status(400)
        .json({ error: "Some items have invalid or missing quantities." });
    }

    const { totalAmount, discountAmount, finalAmount } =
      calculateSummaryFromCartItems(items);

    // Create a new order
    const [orderResult] = await connection.execute(
      `INSERT INTO \`order\` (user_id, total_amount, order_status, cart_id,discount,final_amount,order_date) 
             VALUES (?, ?, 'Pending', ?,?,?,Now())`,
      [userId, totalAmount, cart_id, discountAmount, finalAmount]
    );
    const orderId = orderResult.insertId;

    // Add items to the order_items table
    for (const item of items) {
      const { item_id, quantity, item_price } = item;
      console.log("Attempting to insert into order_items:", {
        orderId,
        item_id,
        quantity,
        item_price,
      });

      try {
        await connection.execute(
          `INSERT INTO order_items (order_id, item_id, quantity, item_price) VALUES (?, ?, ?, ?)
`,
          [orderId, item_id, quantity, item_price]
        );
        console.log("Inserted item successfully:", { orderId, item_id });
      } catch (insertError) {
        console.error("Error inserting item into order_items:", insertError);
        throw insertError;
      }
    }

    // Store delivery details in order_details
    await connection.execute(
      `INSERT INTO order_details (order_id, address, city, postal_code, phone_number, first_name, last_name) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, address, city, postal_code, phone_number, first_name, last_name]
    );

    if (!userEmail) {
      console.error("User email is not available in the request object.");
      return res.status(400).json({
        error: "User email is not defined. Please ensure it is provided.",
      });
    }

    console.log("Recipient email:", userEmail);

    // Send confirmation email to the user
    try {
      await sendEmail(
        userEmail,
        `Order Confirmation - ${orderId}`,
        `Thank you for your order! Your order ID is ${orderId}.\nWe are processing your order, and we will keep you updated on its status. Please stay tuned!`
      );
      console.log("Order confirmation email sent to:", userEmail);
    } catch (emailError) {
      console.error(
        "Failed to send order confirmation email:",
        emailError.message
      );
      return res.status(500).json({
        error: "Failed to send order confirmation email",
      });
    }

    await connection.commit();
    res.json({
      message: "Order placed successfully",
      orderId,
      totalAmount,
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error while placing order:", error);
    res.status(500).json({
      error: "Failed to place order",
    });
  } finally {
    if (connection) connection.release();
  }
};

//Get all orders for admin Management
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.execute(
      "SELECT ord.order_id, GROUP_CONCAT(itm.item_name SEPARATOR ', ') AS item_names, ord.final_amount AS total_final_price, ord.order_status FROM `order` ord JOIN order_items orderItem ON ord.order_id = orderItem.order_id JOIN item itm ON orderItem.item_id = itm.item_id WHERE ord.is_deleted=0 GROUP BY ord.order_id"
    );

    // Formatting the results to a more structured response
    const formattedOrders = orders.map((order) => ({
      order_id: order.order_id,
      item_names: order.item_names,
      total_final_price: order.total_final_price,
      order_status: order.order_status,
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

//Fetch all orders for an user
exports.getUserOrders = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const [orders] = await db.execute(
      `SELECT * FROM \`order\` WHERE user_id = ? ORDER BY order_date DESC`,
      [userId]
    );
    res.json(orders);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

//Fetch order details and items by order Id
exports.getOrderDetails = async (req, res) => {
  const { orderId } = req.params;

  try {
    const [orderDetails] = await db.execute(
      "SELECT od.*, ord.user_id, ord.total_amount AS total_price, ord.discount, ord.final_amount AS final_total_price, ord.order_status FROM order_details od JOIN `order` ord ON od.order_id = ord.order_id WHERE od.order_id = ?",
      [orderId]
    );

    const [orderItems] = await db.execute(
      `SELECT oi.order_item_id,oi.quantity,oi.item_price,oi.item_id,oi.order_id,itm.item_name FROM order_items oi JOIN item itm ON oi.item_id=itm.item_id WHERE oi.order_id=?`,
      [orderId]
    );

    // Check if the order exists
    if (orderDetails.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      orderDetails: orderDetails[0],
      orderItems,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const { newStatus } = req.body;

  console.log("Updating order:", orderId, "with new status:", newStatus);

  try {
    const [rows] = await db.execute(
      `SELECT ord.*, u.email FROM \`order\` ord 
       JOIN user u ON ord.user_id = u.user_id 
       WHERE ord.order_id = ?`,
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = rows[0];

    await db.execute(
      `UPDATE \`order\` SET order_status = ? WHERE order_id = ?`,
      [newStatus, orderId]
    );

    // Send email to the user about the order status update
    const userEmail = order.email;
    if (!userEmail) {
      return res.status(400).json({ error: "User email not found" });
    }
    let subject = `Your Order Status has been Updated - Order ID: ${orderId}`;
    let text;

    console.log("New Status inside switch: ", newStatus);

    // Custom email content based on the new status
    switch (newStatus) {
      case "Pending":
        text = `Hello,\n\nYour order with ID: ${orderId} is currently pending. Our team is working on processing it, and we will keep you updated. \n\nThank you for your patience!`;
        break;
      case "Successful":
        text = `Hello,\n\nWe're happy to inform you that your order with ID: ${orderId} has been successfully processed! We are now preparing your items for shipping. \n\nThank you for shopping with us, and we hope you enjoy your purchase!`;
        break;
      case "Failed":
        text = `Hello,\n\nWe're sorry to inform you that your order with ID: ${orderId} has failed. There was an issue with the payment or processing. Please check your payment details and try again. \n\nIf you need any assistance, feel free to contact us.`;
        break;
      default:
        text = `Hello,\n\nYour order with ID: ${orderId} status has been updated to: ${newStatus}. \n\nThank you for shopping with us!`;
        break;
    }

    await sendEmail(userEmail, subject, text);

    res.json({ message: "Order status updated successfully and email sent" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    await db.execute(`UPDATE \`order\` SET is_deleted = 1 WHERE order_id = ?`, [
      orderId,
    ]);
    res.json({ message: "Order deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Calculate order status percentages
exports.getOrderStatusPercentages = async (req, res) => {
  try {
    const [totalCount] = await db.execute(
      `SELECT COUNT(*) AS count FROM \`order\` WHERE is_deleted=0`
    );
    const totalOrders = totalCount[0].count;

    if (totalOrders === 0) {
      return res.status(200).json({ message: "No orders available." });
    }

    //counts orders by status
    const [pendingCount] = await db.execute(
      `SELECT COUNT(*) AS count FROM \`order\` WHERE order_status = 'Pending' AND is_deleted=0`
    );
    const [successfulCount] = await db.execute(
      `SELECT COUNT(*) AS count FROM \`order\` WHERE order_status = 'Successful' AND is_deleted=0`
    );
    const [failedCount] = await db.execute(
      `SELECT COUNT(*) AS count FROM \`order\` WHERE order_status = 'Failed' AND is_deleted=0`
    );

    const pendingOrders = pendingCount[0].count;
    const successfulOrders = successfulCount[0].count;
    const failedOrders = failedCount[0].count;

    // Calculate percentages
    const pendingPercentage = ((pendingOrders / totalOrders) * 100).toFixed(2);
    const successfulPercentage = (
      (successfulOrders / totalOrders) *
      100
    ).toFixed(2);
    const failedPercentage = ((failedOrders / totalOrders) * 100).toFixed(2);

    res.json({
      pending: pendingPercentage,
      successful: successfulPercentage,
      failed: failedPercentage,
    });
  } catch (error) {
    console.error("Error calculating order status percentages:", error);
    res
      .status(500)
      .json({ error: "Failed to calculate order status percentages." });
  }
};

// Get order statistics
exports.getOrderStatistics = async (req, res) => {
  try {
    const totalCount = await db.execute(
      `SELECT COUNT(*) AS count FROM \`order\` WHERE is_deleted=0`
    );
    const pendingCount = await db.execute(
      `SELECT COUNT(*) AS count FROM \`order\` WHERE order_status = 'Pending' AND is_deleted=0`
    );
    const successfulCount = await db.execute(
      `SELECT COUNT(*) AS count FROM \`order\` WHERE order_status = 'Successful' AND is_deleted=0`
    );
    const failedCount = await db.execute(
      `SELECT COUNT(*) AS count FROM \`order\` WHERE order_status = 'Failed' AND is_deleted=0`
    );

    res.json({
      totalOrders: totalCount[0][0].count,
      pendingOrders: pendingCount[0][0].count,
      successfulOrders: successfulCount[0][0].count,
      failedOrders: failedCount[0][0].count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
