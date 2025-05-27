const db = require("../../config/db");

class Category {
  //Fetch category by name
  static async findByName(category_name) {
    try {
      const [result] = await db.execute(
        "SELECT*FROM category WHERE category_name=?",
        [category_name]
      );
      return result[0];
    } catch (error) {
      throw new Error("Error finding category:" + error.message);
    }
  }

  //Fetch all categories
  static async getAll() {
    try {
      const [results] = await db.execute("SELECT*FROM category");
      return results;
    } catch (error) {
      throw new Error("Error fetching categories" + error.message);
    }
  }
}

module.exports = Category;
