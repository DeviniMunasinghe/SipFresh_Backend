const db = require("../../config/db");

class User {
  // Find user by email
  static async findByEmail(email) {
    try {
      const [result] = await db.execute("SELECT * FROM user WHERE email = ?", [
        email,
      ]);
      return result[0];
    } catch (error) {
      throw new Error("Error finding user by email: " + error.message);
    }
  }

  // Create a new user
  static async create(userData) {
    const { username, email, password, role } = userData;

    console.log("User data:", { username, email, password, role });
    try {
      await db.execute(
        //send the sql queries to the database
        "INSERT INTO user (username, email, password, role) VALUES (?, ?, ?, ?)",
        [username || null, email || null, password || null, role || "user"]
      );
    } catch (error) {
      throw new Error("Error creating user: " + error.message);
    }
  }

  // Create a new admin
  static async createAdmin(adminData) {
    const {
      first_name,
      last_name,
      username,
      email,
      password,
      phone_no,
      address,
      user_image,
      role,
    } = adminData;

    try {
      await db.execute(
        "INSERT INTO user (first_name, last_name, username, email, password, phone_no, address, user_image, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          first_name || null,
          last_name || null,
          username || null,
          email || null,
          password || null,
          phone_no || null,
          address || null,
          user_image || null,
          role || null,
        ]
      );
    } catch (error) {
      throw new Error("Error creating admin: " + error.message);
    }
  }

  //Get all admins to the admin profiles page
  static async findAllAdmins() {
    try {
      const [results] = await db.execute(
        "SELECT * FROM user WHERE role IN (?,?) AND is_deleted = 0",
        ["admin", "super admin"]
      );

      return results;
    } catch (error) {
      throw new Error("Error fetching admins:" + error.message);
    }
  }

  //Delete admin by Id
  static async deleteById(adminId) {
    try {
      await db.execute("UPDATE user SET is_deleted = 1 WHERE user_id = ?", [
        adminId,
      ]);
    } catch (error) {
      throw new Error("Error deleting the admin:" + error.message);
    }
  }

  // Fetch all regular users
  static async findAllUsers() {
    try {
      const [results] = await db.execute(
        "SELECT user_id, email, username FROM user WHERE role = 'user' AND is_deleted = 0"
      );
      return results;
    } catch (error) {
      throw new Error("Error fetching users: " + error.message);
    }
  }
}

module.exports = User;
