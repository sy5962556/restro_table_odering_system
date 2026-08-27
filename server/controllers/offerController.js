const Offer = require('../models/Offer');

// @desc    Get all offers for restaurant
// @route   GET /api/offers/:restaurantId
// @access  Public / Private
exports.getOffers = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId || req.user?.restaurant;
    const { activeOnly } = req.query;

    const query = { restaurant: restaurantId };
    if (activeOnly === 'true') {
      query.isActive = true;
      query.startDate = { $lte: new Date() };
      query.endDate = { $gte: new Date() };
    }

    const offers = await Offer.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Validate a Coupon Code against a Cart Subtotal
// @route   POST /api/offers/validate
// @access  Public
exports.validateOffer = async (req, res, next) => {
  try {
    const { restaurantId, code, subtotal = 0 } = req.body;

    if (!restaurantId || !code) {
      return res.status(400).json({ success: false, message: 'Please provide coupon code' });
    }

    const offer = await Offer.findOne({
      restaurant: restaurantId,
      code: code.trim().toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    if (subtotal < offer.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value for ${offer.code} is ₹${offer.minOrderValue}`
      });
    }

    let discountAmount = 0;
    if (offer.discountType === 'percentage') {
      discountAmount = (subtotal * offer.discountValue) / 100;
      if (offer.maxDiscount && discountAmount > offer.maxDiscount) {
        discountAmount = offer.maxDiscount;
      }
    } else if (offer.discountType === 'flat') {
      discountAmount = Math.min(offer.discountValue, subtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    res.status(200).json({
      success: true,
      message: `Coupon "${offer.code}" applied successfully!`,
      offer: {
        code: offer.code,
        name: offer.name,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        discountAmount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Offer
// @route   POST /api/offers
// @access  Private (Owner / Manager)
exports.createOffer = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.body.restaurant;
    const offer = await Offer.create({
      ...req.body,
      code: req.body.code.trim().toUpperCase(),
      restaurant: restaurantId
    });

    res.status(201).json({ success: true, offer });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Offer
// @route   PUT /api/offers/:id
// @access  Private (Owner / Manager)
exports.updateOffer = async (req, res, next) => {
  try {
    if (req.body.code) req.body.code = req.body.code.trim().toUpperCase();
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.status(200).json({ success: true, offer });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete Offer
// @route   DELETE /api/offers/:id
// @access  Private (Owner / Manager)
exports.deleteOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.status(200).json({ success: true, message: 'Offer deleted successfully' });
  } catch (err) {
    next(err);
  }
};
