const InventoryItem = require('../models/InventoryItem');
const Notification = require('../models/Notification');
const { emitToRestaurant } = require('../config/socket');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private (Owner / Manager / Kitchen)
exports.getInventory = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;
    const { category, status } = req.query;

    const query = { restaurant: restaurantId };
    if (category) query.category = category;

    const items = await InventoryItem.find(query).sort({ ingredient: 1 });

    let filteredItems = items;
    if (status) {
      filteredItems = items.filter(i => i.status === status);
    }

    res.status(200).json({
      success: true,
      count: filteredItems.length,
      inventory: filteredItems
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add new Inventory Ingredient
// @route   POST /api/inventory
// @access  Private (Owner / Manager)
exports.createInventoryItem = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.body.restaurant;
    const item = await InventoryItem.create({
      ...req.body,
      restaurant: restaurantId
    });

    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Inventory Item
// @route   PUT /api/inventory/:id
// @access  Private (Owner / Manager)
exports.updateInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    res.status(200).json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

// @desc    Adjust Stock Quantity (Restock or Deduct)
// @route   PATCH /api/inventory/:id/adjust
// @access  Private (Owner / Manager / Kitchen)
exports.adjustStock = async (req, res, next) => {
  try {
    const { amount, action = 'add', reason = '' } = req.body;
    const item = await InventoryItem.findById(req.params.id);

    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    const delta = parseFloat(amount);
    if (isNaN(delta) || delta < 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid adjustment quantity' });
    }

    if (action === 'add') {
      item.currentStock += delta;
      item.lastRestockedAt = new Date();
    } else if (action === 'deduct') {
      item.currentStock = Math.max(0, item.currentStock - delta);
    } else if (action === 'set') {
      item.currentStock = delta;
    }

    item.currentStock = Math.round(item.currentStock * 100) / 100;
    await item.save();

    // Check for Low Stock Alert
    if (item.currentStock <= item.minimumStock) {
      const notification = await Notification.create({
        restaurant: item.restaurant,
        title: `⚠️ Low Stock Alert: ${item.ingredient}`,
        message: `${item.ingredient} is running low (${item.currentStock} ${item.unit} remaining). Minimum threshold is ${item.minimumStock} ${item.unit}.`,
        type: 'LOW_STOCK',
        metadata: { inventoryItemId: item._id, currentStock: item.currentStock }
      });

      emitToRestaurant(item.restaurant, 'stockAlert', {
        item,
        notification
      });
    }

    res.status(200).json({
      success: true,
      message: `Stock updated to ${item.currentStock} ${item.unit}`,
      item
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete Inventory Item
// @route   DELETE /api/inventory/:id
// @access  Private (Owner / Manager)
exports.deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    res.status(200).json({ success: true, message: 'Inventory item deleted' });
  } catch (err) {
    next(err);
  }
};
