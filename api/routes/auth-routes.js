const express = require("express");
const authController = require("../controllers/auth-controller");
const multer = require("multer");
const { storage } = require("../../config/cloudinary");
const {
  protect,
  superAdminOnly,
  adminOrSuperAdmin,
} = require("../middleware/auth-middleware");

const router = express.Router();

const upload = multer({ storage });

//User registration
router.post("/register", authController.register);

//User/Admin login
router.post("/login", authController.login);

//Admin creation(-super-admin-only route)
router.post(
  "/add-admin",
  upload.single("user_image"),
  protect,
  superAdminOnly,
  authController.addAdmin
);

//Get all admins
router.get("/admins", protect, adminOrSuperAdmin, authController.getAllAdmins);

//Delete an admin by Id
router.delete(
  "/admins/:user_id",
  protect,
  superAdminOnly,
  authController.deleteAdmin
);

// Fetch all registered users (only accessible to admins and super-admins)
router.get("/users", protect, adminOrSuperAdmin, authController.getAllUsers);
module.exports = router;
