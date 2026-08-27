const Table = require('../models/Table');
const QRCode = require('../models/QRCode');
const { generateTableToken, generateQRCodeDataUrl } = require('../utils/qrGenerator');
const { emitToRestaurant } = require('../config/socket');

// @desc    Get all tables for restaurant
// @route   GET /api/tables OR GET /api/tables/restaurant/:restaurantId
// @access  Public / Private
exports.getTables = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId || req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;
    const query = restaurantId ? { restaurant: restaurantId } : {};
    const tables = await Table.find(query)
      .populate('currentOrder')
      .sort({ tableNumber: 1 });

    res.status(200).json({
      success: true,
      count: tables.length,
      tables
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single table by ID or tableNumber
// @route   GET /api/tables/:id OR GET /api/tables/single/:id
// @access  Public
exports.getTable = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const idParam = req.params.id;
    let table = null;

    if (mongoose.Types.ObjectId.isValid(idParam)) {
      table = await Table.findById(idParam).populate('currentOrder');
    }
    if (!table) {
      table = await Table.findOne({ tableNumber: idParam }).populate('currentOrder');
    }
    if (!table) {
      table = await Table.findOne({ tableNumber: String(idParam).padStart(2, '0') }).populate('currentOrder');
    }

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    res.status(200).json({ success: true, table });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new Table and its unique QR code
// @route   POST /api/tables
// @access  Private (Owner / Manager)
exports.createTable = async (req, res, next) => {
  try {
    const { tableNumber, tableName, capacity, floor, section } = req.body;
    const restaurantId = req.user.restaurant?._id || req.user.restaurant || req.body.restaurant;

    const existing = await Table.findOne({ restaurant: restaurantId, tableNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: `Table ${tableNumber} already exists` });
    }

    const qrToken = generateTableToken(tableNumber);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const orderUrl = `${clientUrl}/order/${restaurantId}/${tableNumber}?token=${qrToken}`;
    const qrDataUrl = await generateQRCodeDataUrl(orderUrl);

    const table = await Table.create({
      restaurant: restaurantId,
      tableNumber,
      tableName: tableName || `Table ${tableNumber}`,
      capacity: capacity || 4,
      floor: floor || 'Ground Floor',
      section: section || 'Main Hall',
      status: 'AVAILABLE',
      qrCodeToken: qrToken,
      qrCodeUrl: orderUrl
    });

    const qrCode = await QRCode.create({
      restaurant: restaurantId,
      table: table._id,
      tableNumber,
      token: qrToken,
      orderUrl,
      qrDataUrl
    });

    emitToRestaurant(restaurantId, 'tableUpdated', { action: 'create', table });

    res.status(201).json({
      success: true,
      message: `Table ${tableNumber} created with active QR code`,
      table,
      qrCode
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update table details or status
// @route   PUT /api/tables/:id
// @access  Private
exports.updateTable = async (req, res, next) => {
  try {
    const { status, tableName, capacity, floor, section, currentCustomer } = req.body;

    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    if (status) table.status = status;
    if (tableName) table.tableName = tableName;
    if (capacity) table.capacity = capacity;
    if (floor) table.floor = floor;
    if (section) table.section = section;
    if (currentCustomer !== undefined) table.currentCustomer = currentCustomer;

    if (status === 'OCCUPIED' && !table.lastOccupiedAt) {
      table.lastOccupiedAt = new Date();
    }

    if (status === 'AVAILABLE' || status === 'CLEANING') {
      table.currentCustomer = null;
      table.currentOrder = null;
      table.currentSessionId = null;
      if (status === 'AVAILABLE') table.lastCleanedAt = new Date();
    }

    await table.save();

    emitToRestaurant(table.restaurant, 'tableUpdated', { action: 'update', table });

    res.status(200).json({ success: true, table });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset / Clear table to Available
// @route   POST /api/tables/:id/reset
// @access  Private
exports.resetTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    table.status = 'AVAILABLE';
    table.currentCustomer = null;
    table.currentOrder = null;
    table.currentSessionId = null;
    table.lastCleanedAt = new Date();
    await table.save();

    emitToRestaurant(table.restaurant, 'tableUpdated', { action: 'reset', table });

    res.status(200).json({ success: true, message: `Table ${table.tableNumber} is now available`, table });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private (Owner)
exports.deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    await QRCode.deleteMany({ table: table._id });
    await table.deleteOne();

    emitToRestaurant(table.restaurant, 'tableUpdated', { action: 'delete', tableId: req.params.id });

    res.status(200).json({ success: true, message: 'Table deleted successfully' });
  } catch (err) {
    next(err);
  }
};
