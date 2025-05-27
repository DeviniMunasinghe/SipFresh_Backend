const express = require("express");
const { protect, adminOrSuperAdmin } = require("../middleware/auth-middleware");
const promotionController = require("../controllers/promotion-controller");
const multer = require("multer");
const { storage } = require("../../config/cloudinary");

const router = express.Router();

const upload = multer({ storage });

// Admin-only route to add promotions
router.post(
  "/add-promotion",
  protect,
  adminOrSuperAdmin,
  upload.single("promotion_image"),
  promotionController.addPromotion
);

router.post("/apply", promotionController.applyPromotion);

// Admin-only route to delete a promotion by ID
router.delete(
  "/:promotionId",
  protect,
  adminOrSuperAdmin,
  promotionController.deletePromotion
);

// Admin-only route to fetch a promotion by ID
router.get(
  "/:promotionId",
  protect,
  adminOrSuperAdmin,
  promotionController.getPromotionById
);

// Public route to get active promotions
router.get("/", promotionController.getAllPromotions);
module.exports = router;
