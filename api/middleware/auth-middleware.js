const jwt = require("jsonwebtoken");
const db = require("../../config/db");

exports.protect = async (req, res, next) => {
  console.log("Middleware protect executed");

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token received:", token);

      //verify and decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Fetch the user from the database using the decoded user_id
      const [user] = await db.execute(
        "SELECT user_id, email, role FROM user WHERE user_id = ?",
        [decoded.userId]
      );

      if (!user || user.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }

      // Add user details (including email) to the req.user object
      req.user = {
        user_id: user[0].user_id,
        email: user[0].email,
        role: user[0].role,
      };

      console.log("User authenticated:", req.user);
      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

exports.superAdminOnly = (req, res, next) => {
  if (req.user.role !== "super admin") {
    return res.status(403).json({
      message: "Access denied, super admins only",
    });
  }
  next();
};

// Middleware to allow access for admin and super admin
exports.adminOrSuperAdmin = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "super admin") {
    return res.status(403).json({
      message: "Access denied, admins or super admins only",
    });
  }
  next();
};
