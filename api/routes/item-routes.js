const express = require("express");
const itemController = require("../controllers/item-controller");
const { protect, adminOrSuperAdmin } = require("../middleware/auth-middleware");
const multer = require("multer");
const { storage } = require("../../config/cloudinary");

const router = express.Router();
const upload = multer({ storage });

// Upload a new item (admin only)
router.post(
  "/add-item",
  protect,
  adminOrSuperAdmin,
  upload.single("item_image"),
  itemController.addItem
);

//Fetch items by category
router.get("/category/:category_name", itemController.getItemsByCategory);

// Fetch all items
router.get("/get_all", protect, adminOrSuperAdmin, itemController.getAllItems);

// Fetch a single item by its ID
router.get("/:item_id", protect, itemController.getItemById);

// Update an item (with image upload)
router.put(
  "/:item_id",
  upload.single("item_image"),
  protect,
  adminOrSuperAdmin,
  itemController.updateItem
);

// Delete an item (soft delete)
router.delete(
  "/:item_id",
  protect,
  adminOrSuperAdmin,
  itemController.deleteItem
);

module.exports = router;
