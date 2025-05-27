const Promotion = require("../models/Promotion");

// Add a new promotion
exports.addPromotion = async (req, res) => {
  const {
    title,
    promotion_description,
    start_date,
    end_date,
    categories,
    rules,
  } = req.body;
  const promotion_image = req.file ? req.file.path : null;

  try {
    const promotionData = {
      title: title || null,
      promotion_description: promotion_description || null,
      promotion_image,
      start_date: start_date || null,
      end_date: end_date || null,
      categories: categories || null,
    };
    const parsedRules = rules ? JSON.parse(rules) : [];

    const formattedRules = parsedRules.map((rule) => ({
      min_price: rule.min_price || 0,
      discount_percentage: rule.discount_percentage || 0,
    }));

    const promotion = await Promotion.create(promotionData, formattedRules);

    res
      .status(201)
      .json({ message: "Promotion added successfully", promotion });
  } catch (error) {
    console.error("Error adding promotion:", error);
    res
      .status(500)
      .json({ message: "Error adding promotion", error: error.message });
  }
};

//Apply promotion logic to the order
exports.applyPromotion = async (req, res) => {
  const { total_price, categories } = req.body;

  try {
    const promotions = await Promotion.findAll();
    let discount = 0;

    promotions.forEach((promo) => {
      const promoCategories = promo.categories;

      if (promoCategories === categories) {
        promo.rules.forEach((rule) => {
          if (total_price >= rule.min_price) {
            discount = Math.max(discount, rule.discount_percentage);
          }
        });
      }
    });

    const final_price = total_price - (total_price * discount) / 100;

    res.status(200).json({
      message: `Applied ${discount}% discount`,
      original_price: total_price,
      final_price,
      discount_percentage: discount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error applying promotion", error: error.message });
  }
};

// Delete a promotion by ID
exports.deletePromotion = async (req, res) => {
  const { promotionId } = req.params;

  console.log(`Request to delete promotion with ID: ${promotionId}`);

  try {
    const result = await Promotion.deleteById(promotionId);
    console.log("Delete result:", result);
    res.status(204).send("Promotion deleted successfully");
  } catch (error) {
    console.error("Error deleting promotion:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get a single promotion by its ID
exports.getPromotionById = async (req, res) => {
  const { promotionId } = req.params;

  try {
    const promotion = await Promotion.findById(promotionId);

    if (!promotion) {
      return res.status(404).json({
        message: "Promotion not found",
      });
    }

    res.status(200).json(promotion);
  } catch (error) {
    console.error("Error fetching promotion:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all active promotions
exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.findAll();
    console.log("Promotions with rules:", promotions);
    res.status(200).json(promotions);
  } catch (error) {
    console.error("Error fetching promotions:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
