const Category = require("../models/Category");
const Item = require("../models/Item");

//Add a new item (admin only)
exports.addItem = async (req, res) => {
  console.log("Add item request received");

  const { item_name, item_description, item_price, category_name } = req.body;

  if (!req.file || !req.file.path) {
    return res.status(400).json({ message: "Item image is required" });
  }

  const item_image = req.file.path;

  try {
    //Find category by name
    const category = await Category.findByName(category_name);

    if (!category) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    //Create item
    await Item.create({
      item_name,
      item_image,
      item_description,
      item_price,
      category_id: category.category_id,
    });

    res.status(200).json({
      message: "Item added successfully",
    });
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({
      message: "Server error:",
      error: error.message,
    });
  }
};

//get all items based on category(pizza,cake,beverage)
exports.getItemsByCategory = async (req, res) => {
  const { category_name } = req.params;

  try {
    //Find category by name
    const category = await Category.findByName(category_name);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    //fetch items by category_id
    const items = await Item.findByCategory(category.category_id);

    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

//Get all items for admin (excluding deleted ones)
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.findAll();
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({
      message: "server error",
      error: error.message,
    });
  }
};

// Fetch a single item by its ID
exports.getItemById = async (req, res) => {
  const { item_id } = req.params; // Get item ID from the request parameters

  try {
    const item = await Item.findById(item_id); // Fetch the item using the model

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update an Item
exports.updateItem = async (req, res) => {
  const { item_id } = req.params;
  const { item_name, item_description, item_price, category_name } = req.body;
  let item_image =  req.file ? req.file.path : null;

  try {
    // Find the category by name
    const category = await Category.findByName(category_name);
    if (!category) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    //Fetch current item details from the DB
    const currentItem = await Item.findById(item_id);
    if (!currentItem) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    // If no new image uploaded, retain the existing one
    if (!item_image) {
      item_image = currentItem.item_image;
    }

    // Prepare the item data, ensuring undefined values are converted to null
    const itemData = {
      item_name: item_name !== undefined ? item_name : null,
      item_image: item_image !== undefined ? item_image : null,
      item_description:
        item_description !== undefined ? item_description : null,
      item_price: item_price !== undefined ? item_price : null,
      category_id: category.category_id,
    };

    // Debugging: Log itemData before updating
    console.log("Item data for update:", itemData);

    // Update the item in the database
    await Item.update(item_id, itemData);

    res.status(200).json({
      message: "Item updated successfully",
      item: itemData,
    });
  } catch (error) {
    console.error("Error Updating item:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

//Soft delete an item
exports.deleteItem = async (req, res) => {
  const { item_id } = req.params;

  try {
    await Item.softDelete(item_id);
    res.status(200).json({
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
