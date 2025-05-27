const db = require("../../config/db");

class Promotion {
  // Create a new promotion with associated rules
  static async create(promotionData, rules) {
    const {
      title,
      promotion_description,
      promotion_image,
      start_date,
      end_date,
      categories,
    } = promotionData;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        "INSERT INTO promotion (title, promotion_description, promotion_image, start_date, end_date,categories) VALUES (?, ?, ?, ?, ?, ?)",
        [
          title,
          promotion_description,
          promotion_image,
          start_date,
          end_date,
          categories,
        ]
      );

      const promotion_id = result.insertId;

      // Insert associated rules
      if (rules && rules.length > 0) {
        for (const rule of rules) {
          console.log(
            "Inserting rule:",
            rule,
            "for promotion_id:",
            promotion_id
          );
          await connection.execute(
            `INSERT INTO promotion_rule (promotion_id, min_price, discount_percentage) 
            VALUES (?, ?, ?)`,
            [promotion_id, rule.min_price, rule.discount_percentage]
          );
        }
      } else {
        console.log("No rules to insert");
      }

      await connection.commit();

      return {
        promotion_id,
        title,
        promotion_description,
        promotion_image,
        start_date,
        end_date,
        categories,
        rules,
      };
    } catch (error) {
      await connection.rollback();
      throw new Error("Error creating promotion: " + error.message);
    } finally {
      connection.release();
    }
  }

  // Delete a promotion and its rules by ID
  static async deleteById(promotionId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `DELETE FROM promotion_rule WHERE promotion_id = ?`,
        [promotionId]
      );

      await connection.execute(`DELETE FROM promotion WHERE promotion_id = ?`, [
        promotionId,
      ]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw new Error("Error deleting promotion: " + error.message);
    } finally {
      connection.release();
    }
  }

  // Find promotion by ID with rules
  static async findById(promotionId) {
    try {
      const [promotionResults] = await db.execute(
        "SELECT * FROM promotion WHERE promotion_id = ?",
        [promotionId]
      );

      const promotion = promotionResults[0];

      if (!promotion) return null;

      const [rules] = await db.execute(
        `SELECT * FROM promotion_rule WHERE promotion_id = ?`,
        [promotionId]
      );

      console.log("Fetched rules for promotion:", rules);
      promotion.rules = rules.map((rule) => ({
        rule_id: rule.rule_id,
        min_price: rule.min_price,
        discount_percentage: rule.discount_percentage,
      }));
      return promotion;
    } catch (error) {
      throw new Error("Error fetching promotion: " + error.message);
    }
  }

  static async findAll() {
    try {
      // Fetch all promotions
      const [promotions] = await db.execute(`SELECT * FROM promotion`);
      if (promotions.length === 0) return promotions; // Return empty if no promotions found

      // Collect promotion IDs
      const promotionIds = promotions.map((promo) => promo.promotion_id);

      // Fetch all rules for the collected promotion IDs
      const [rules] = await db.execute(
        `SELECT * FROM promotion_rule WHERE promotion_id IN (${promotionIds.join(
          ","
        )})`
      );

      // Group rules by promotion_id
      const groupedRules = {};
      promotionIds.forEach((id) => (groupedRules[id] = [])); // Initialize empty arrays for each promotion_id

      rules.forEach((rule) => {
        if (!groupedRules[rule.promotion_id]) {
          groupedRules[rule.promotion_id] = [];
        }
        groupedRules[rule.promotion_id].push({
          rule_id: rule.rule_id,
          min_price: rule.min_price,
          discount_percentage: rule.discount_percentage,
        });
      });

      // Attach rules to the corresponding promotion
      return promotions.map((promotion) => ({
        ...promotion,
        rules: groupedRules[promotion.promotion_id] || [],
      }));
    } catch (error) {
      console.error("Error fetching promotions:", error);
      throw new Error("Failed to fetch promotions.");
    }
  }
}

module.exports = Promotion;
