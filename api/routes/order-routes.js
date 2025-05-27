const express = require("express");
const orderController = require("../controllers/order-controller");
const { protect, adminOrSuperAdmin } = require("../middleware/auth-middleware");
const router = express.Router();

// Route to transfer selected items to checkout
router.post(
  "/checkout/transfer-selected",
  protect,
  orderController.transferSelectedItemsToCheckout
);

//route to fetch selected items in checkout
router.get(
  "/checkout/selected-items",
  protect,
  orderController.getSelectedItemsInCheckout
);

// Route to remove items from checkout
router.post(
  "/checkout/remove-items-from-checkout/:selectedCartItemId",
  protect,
  orderController.removeItemsFromCheckout
);

// Calculate order summary for selected items
router.post("/order-summary", protect, orderController.calculateOrderSummary);

// Route to calculate order summary using GET method
router.get("/order-summary", protect, orderController.getOrderSummary);

//Place an order
router.post("/place", protect, orderController.placeOrder);

// Route for admins to fetch all orders along with their details
router.get(
  "/admin/orders",
  protect,
  adminOrSuperAdmin,
  orderController.getAllOrders
);

//Get order details by Id
router.get(
  "/order-details/:orderId",
  protect,
  adminOrSuperAdmin,
  orderController.getOrderDetails
);

// Route for admins to update the status of a specific order
router.put(
  "/admin/order-status/:orderId",
  protect,
  adminOrSuperAdmin,
  orderController.updateOrderStatus
);

// Route for admins to delete a specific order by its ID
router.delete(
  "/admin/delete/:orderId",
  protect,
  adminOrSuperAdmin,
  orderController.deleteOrder
);

// Route for admins to fetch order statistics (total, pending, successful, failed orders)
router.get(
  "/admin/statistics",
  protect,
  adminOrSuperAdmin,
  orderController.getOrderStatistics
);

// Route for admins to get the percentage of each order status (Pending, Successful, Failed)
router.get(
  "/admin/order-status-percentages",
  protect,
  adminOrSuperAdmin,
  orderController.getOrderStatusPercentages
);

module.exports = router;
