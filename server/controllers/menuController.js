const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const { generateMenuDescription } = require('../utils/aiPredictor');
const { emitToRestaurant } = require('../config/socket');

// @desc    Get complete menu for a restaurant (categories + products)
// @route   GET /api/menu/:restaurantId
// @access  Public
exports.getMenu = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;
    const { includeUnavailable } = req.query;

    const categoryQuery = { restaurant: restaurantId, isActive: true };
    const categories = await Category.find(categoryQuery).sort({ displayOrder: 1, name: 1 });

    const itemQuery = { restaurant: restaurantId };
    if (includeUnavailable !== 'true') {
      // For customer public view, fetch all but keep availability flag
    }

    const items = await MenuItem.find(itemQuery)
      .populate('category', 'name slug icon')
      .sort({ displayOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      categories,
      items
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all categories
// @route   GET /api/menu/categories/:restaurantId
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId || req.user?.restaurant;
    const categories = await Category.find({ restaurant: restaurantId }).sort({ displayOrder: 1 });
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Category
// @route   POST /api/menu/categories
// @access  Private (Owner / Manager)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, image, icon, displayOrder } = req.body;
    const restaurantId = req.user.restaurant?._id || req.user.restaurant || req.body.restaurant;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = await Category.create({
      restaurant: restaurantId,
      name,
      slug,
      description,
      image,
      icon,
      displayOrder: displayOrder || 0
    });

    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Category
// @route   PUT /api/menu/categories/:id
// @access  Private (Owner / Manager)
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete Category
// @route   DELETE /api/menu/categories/:id
// @access  Private (Owner / Manager)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Check if items belong to this category
    const itemsCount = await MenuItem.countDocuments({ category: category._id });
    if (itemsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${itemsCount} menu items are currently assigned to it. Please reassign or delete items first.`
      });
    }

    await category.deleteOne();
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Menu Item
// @route   POST /api/menu/items
// @access  Private (Owner / Manager)
exports.createMenuItem = async (req, res, next) => {
  try {
    const restaurantId = req.user.restaurant?._id || req.user.restaurant || req.body.restaurant;
    const item = await MenuItem.create({
      ...req.body,
      restaurant: restaurantId
    });

    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Menu Item
// @route   PUT /api/menu/items/:id
// @access  Private (Owner / Manager)
exports.updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });

    // Broadcast menu update to connected clients
    emitToRestaurant(item.restaurant, 'menuAvailabilityChanged', { itemId: item._id, isAvailable: item.isAvailable, item });

    res.status(200).json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle Menu Item Availability (Instant 1-Click)
// @route   PATCH /api/menu/items/:id/availability
// @access  Private (Owner / Manager / Kitchen)
exports.toggleItemAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });

    item.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : !item.isAvailable;
    await item.save();

    // Broadcast instant Socket.IO update to customer screens
    emitToRestaurant(item.restaurant, 'menuAvailabilityChanged', {
      itemId: item._id,
      name: item.name,
      isAvailable: item.isAvailable
    });

    res.status(200).json({
      success: true,
      message: `"${item.name}" is now marked ${item.isAvailable ? 'Available' : 'Unavailable'}`,
      isAvailable: item.isAvailable,
      item
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete Menu Item
// @route   DELETE /api/menu/items/:id
// @access  Private (Owner / Manager)
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate AI Menu Description
// @route   POST /api/menu/ai-description
// @access  Private (Owner / Manager)
exports.generateAIDescription = async (req, res, next) => {
  try {
    const { name, ingredients, cuisine, foodType, spicyLevel } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Dish name is required' });

    const description = generateMenuDescription({
      name,
      ingredients: Array.isArray(ingredients) ? ingredients : (ingredients || '').split(',').map(i => i.trim()),
      cuisine: cuisine || 'Indian',
      foodType: foodType || 'veg',
      spicyLevel: spicyLevel || 'medium'
    });

    res.status(200).json({
      success: true,
      description
    });
  } catch (err) {
    next(err);
  }
};
