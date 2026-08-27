const WaiterCall = require('../models/WaiterCall');
const Notification = require('../models/Notification');
const Table = require('../models/Table');
const { emitToRestaurant } = require('../config/socket');

// @desc    Customer calls waiter / requests assistance
// @route   POST /api/waiter-calls
// @access  Public
exports.callWaiter = async (req, res, next) => {
  try {
    const { restaurantId, tableNumber, reason, note } = req.body;

    const table = await Table.findOne({ restaurant: restaurantId, tableNumber });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    const waiterCall = await WaiterCall.create({
      restaurant: restaurantId,
      table: table._id,
      tableNumber,
      reason: reason || 'Need Assistance',
      note: note || '',
      status: 'pending'
    });

    const notification = await Notification.create({
      restaurant: restaurantId,
      title: `🔔 Table ${tableNumber} Called Waiter`,
      message: `Table ${tableNumber} needs: ${reason || 'Assistance'}`,
      type: 'CALL_WAITER',
      tableNumber,
      metadata: { waiterCallId: waiterCall._id, reason, note }
    });

    // Real-Time Broadcast to Staff
    emitToRestaurant(restaurantId, 'waiterCalled', {
      waiterCall,
      notification
    });

    res.status(201).json({
      success: true,
      message: 'Waiter notified! Our staff is on their way to your table.',
      waiterCall
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active waiter calls
// @route   GET /api/waiter-calls
// @access  Private (Staff / Waiter / Manager)
exports.getWaiterCalls = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;
    const calls = await WaiterCall.find({
      restaurant: restaurantId,
      status: { $in: ['pending', 'in_progress'] }
    })
      .populate('table')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: calls.length, calls });
  } catch (err) {
    next(err);
  }
};

// @desc    Resolve / Attend waiter call
// @route   PATCH /api/waiter-calls/:id/resolve
// @access  Private
exports.resolveWaiterCall = async (req, res, next) => {
  try {
    const call = await WaiterCall.findById(req.params.id);
    if (!call) return res.status(404).json({ success: false, message: 'Call request not found' });

    call.status = 'resolved';
    call.attendedBy = req.user?._id;
    call.resolvedAt = new Date();
    await call.save();

    emitToRestaurant(call.restaurant, 'waiterCallResolved', {
      callId: call._id,
      tableNumber: call.tableNumber
    });

    res.status(200).json({ success: true, message: 'Request marked as resolved', call });
  } catch (err) {
    next(err);
  }
};
