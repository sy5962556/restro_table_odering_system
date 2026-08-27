const QRCodeModel = require('../models/QRCode');
const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');
const { generateTableToken, generateQRCodeDataUrl } = require('../utils/qrGenerator');

// @desc    Validate QR code upon customer scanning
// @route   GET /api/qr/validate
// @access  Public
exports.validateTableQR = async (req, res, next) => {
  try {
    const { restaurantId, tableNumber, token } = req.query;

    if (!restaurantId || !tableNumber) {
      return res.status(400).json({ success: false, message: 'Missing restaurant or table identification' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found or inactive' });
    }

    const table = await Table.findOne({ restaurant: restaurantId, tableNumber });
    if (!table) {
      return res.status(404).json({ success: false, message: `Table ${tableNumber} not found` });
    }

    if (!table.isActive) {
      return res.status(400).json({ success: false, message: `Table ${tableNumber} is currently out of service` });
    }

    // Optional token validation check
    if (token && table.qrCodeToken && token !== table.qrCodeToken) {
      // In case table token was regenerated
      console.warn(`Table token mismatch for table ${tableNumber}`);
    }

    // Increment scan count on QRCode model
    await QRCodeModel.findOneAndUpdate(
      { restaurant: restaurantId, tableNumber },
      { $inc: { scanCount: 1 }, lastScannedAt: new Date() }
    );

    res.status(200).json({
      success: true,
      valid: true,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        tagline: restaurant.tagline,
        logo: restaurant.logo,
        banner: restaurant.banner,
        currency: restaurant.currency,
        taxRate: restaurant.taxRate,
        serviceChargeRate: restaurant.serviceChargeRate,
        isAcceptingOrders: restaurant.isAcceptingOrders
      },
      table: {
        id: table._id,
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        section: table.section,
        floor: table.floor,
        status: table.status,
        currentCustomer: table.currentCustomer
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all QR codes for restaurant
// @route   GET /api/qr/all/:restaurantId
// @access  Private (Owner / Manager)
exports.getAllQRCodes = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId || req.user?.restaurant;
    const qrCodes = await QRCodeModel.find({ restaurant: restaurantId }).populate('table').sort({ tableNumber: 1 });
    res.status(200).json({ success: true, count: qrCodes.length, qrCodes });
  } catch (err) {
    next(err);
  }
};

// @desc    Regenerate QR token for a table
// @route   POST /api/qr/regenerate/:tableId
// @access  Private (Owner)
exports.regenerateQR = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.tableId);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const newToken = generateTableToken(table.tableNumber);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const orderUrl = `${clientUrl}/order/${table.restaurant}/${table.tableNumber}?token=${newToken}`;
    const qrDataUrl = await generateQRCodeDataUrl(orderUrl);

    table.qrCodeToken = newToken;
    table.qrCodeUrl = orderUrl;
    await table.save();

    const qrCode = await QRCodeModel.findOneAndUpdate(
      { table: table._id },
      { token: newToken, orderUrl, qrDataUrl, lastScannedAt: null },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `QR code for Table ${table.tableNumber} regenerated successfully`,
      table,
      qrCode
    });
  } catch (err) {
    next(err);
  }
};
