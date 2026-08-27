const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate unique secure token for table
 */
const generateTableToken = (tableNumber) => {
  return `${tableNumber.toString().padStart(2, '0')}_${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * Generate QR code Data URL (PNG base64) for ordering page
 */
const generateQRCodeDataUrl = async (orderUrl) => {
  try {
    const dataUrl = await QRCode.toDataURL(orderUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 400,
      color: {
        dark: '#1e293b', // slate-800
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code image:', err);
    throw err;
  }
};

module.exports = {
  generateTableToken,
  generateQRCodeDataUrl
};
