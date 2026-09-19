const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const config = require('../config');
const { db } = require('../db');
const whatsappService = require('../services/whatsappService');
const { getClientStatus, client, sendWhatsApp } = require('../../whatsapp-client');

/**
 * GET /api/whatsapp/config
 * Returns configured WhatsApp routing numbers and UPI ID
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    deliveryPartnerPhone: config.deliveryPartnerPhone,
    companyPhone: config.companyPhone,
    companyUpiId: config.companyUpiId,
    sellerWhatsAppUrl: `https://wa.me/${config.companyPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('नमस्ते Kaarigar AI, मैं अपना हस्तशिल्प सामान बेचना चाहता हूँ।')}`
  });
});

/**
 * POST /api/whatsapp/dispatch-order
 * Triggers dual notifications for a given order (Delivery partner + Company HQ)
 */
router.post('/dispatch-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    const orders = await db.getAllOrders();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: `Order ${orderId} not found` });
    }

    const products = await db.getAllProducts();
    const product = products.find(p => p.id === order.productId);

    const dispatchResult = whatsappService.dispatchOrderNotifications(order, product);

    res.json({
      success: true,
      message: 'Dual WhatsApp notifications dispatched successfully!',
      dispatch: dispatchResult
    });
  } catch (err) {
    console.error('WhatsApp dispatch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/seller-bot
 * Conversational endpoint for the Seller WhatsApp Bot
 */
router.post('/seller-bot', (req, res) => {
  try {
    const { message, imageBase64 } = req.body;
    const botResponse = whatsappService.processSellerBotMessage(message, { imageBase64 });
    res.json({
      success: true,
      data: botResponse
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/whatsapp/status
 * Returns connection state of whatsapp-web.js client
 */
router.get('/status', (req, res) => {
  const status = getClientStatus();
  res.json({
    success: true,
    data: status
  });
});

/**
 * POST /api/whatsapp/initialize
 * Starts headless browser session to connect to WhatsApp Web
 */
router.post('/initialize', (req, res) => {
  try {
    const status = getClientStatus();
    if (status.isReady) {
      return res.json({ success: true, message: 'WhatsApp client is already connected and ready.' });
    }
    client.initialize().catch(err => {
      console.warn('[WhatsApp] Initialization deferred error:', err.message);
    });
    res.json({
      success: true,
      message: 'WhatsApp Web client initialization initiated. Check terminal for QR code if first time.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/whatsapp/qr
 * Returns live QR code as base64 data URL image and raw string
 */
router.get('/qr', async (req, res) => {
  try {
    const status = getClientStatus();
    if (status.isReady) {
      return res.json({
        success: true,
        isReady: true,
        message: 'WhatsApp Web client is connected and ready!'
      });
    }
    if (!status.hasQr || !status.currentQr) {
      return res.json({
        success: false,
        isReady: false,
        hasQr: false,
        message: 'Waiting for QR code generation. Initializing WhatsApp Web client...'
      });
    }
    const qrDataUrl = await QRCode.toDataURL(status.currentQr, {
      width: 320,
      margin: 2
    });
    res.json({
      success: true,
      isReady: false,
      hasQr: true,
      dataUrl: qrDataUrl,
      rawQr: status.currentQr
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/send-test
 * Sends a test message using the connected WhatsApp client
 */
router.post('/send-test', async (req, res) => {
  try {
    const { number, message } = req.body || {};
    const targetNumber = number || config.companyPhone;
    const targetMsg = message || `🎉 *KAARIGAR AI WhatsApp Verification*\nHello! This message confirms that your WhatsApp number +91 6371205518 is successfully linked and active as the official notification engine for Kaarigar AI!`;
    const result = await sendWhatsApp(targetNumber, targetMsg);
    res.json({
      success: result.success,
      result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
