const express = require('express');
const router = express.Router();
const os = require('os');
const QRCode = require('qrcode');
const config = require('../config');
const { getDatabaseStatus } = require('../db');

// Helper to find local network IPv4 addresses (Wi-Fi, Ethernet, Hotspot)
function getLocalNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Filter out internal/loopback and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interfaceName: name,
          ip: iface.address
        });
      }
    }
  }
  return addresses;
}

// GET /api/server/network-info
router.get('/network-info', async (req, res) => {
  try {
    const networkInterfaces = getLocalNetworkAddresses();
    const primaryIp = networkInterfaces.length > 0 ? networkInterfaces[0].ip : 'localhost';
    const localUrl = `http://localhost:${config.port}`;
    
    // Direct URLs for the 2 distinct experiences:
    // The phone application is specifically for the seller/artisan!
    const sellerUrl = `http://${primaryIp}:${config.port}/artisan`;
    const buyerUrl = `http://${primaryIp}:${config.port}/`;

    // Dynamic QR code pointing directly to the Seller Phone App
    const sellerQrCodeDataUrl = await QRCode.toDataURL(sellerUrl, {
      margin: 2,
      width: 280,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      }
    });

    const buyerQrCodeDataUrl = await QRCode.toDataURL(buyerUrl, {
      margin: 2,
      width: 280,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      }
    });

    const dbStatus = await getDatabaseStatus();

    res.json({
      success: true,
      server: {
        status: "Online & Listening to All Devices (0.0.0.0)",
        port: config.port,
        host: config.host,
        primaryIp: primaryIp,
        localUrl: localUrl,
        sellerUrl: sellerUrl,
        buyerUrl: buyerUrl,
        qrCodeDataUrl: sellerQrCodeDataUrl, // Defaults to Seller Phone App
        sellerQrCodeDataUrl: sellerQrCodeDataUrl,
        buyerQrCodeDataUrl: buyerQrCodeDataUrl,
        networkInterfaces: networkInterfaces,
        machineName: os.hostname(),
        platform: `${os.type()} (${os.arch()})`
      },
      database: dbStatus,
      config: config.getPublicConfig()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/server/config - Live update database settings or API keys
router.post('/config', async (req, res) => {
  try {
    const { databaseType, databaseUrl, geminiApiKey } = req.body;
    const updated = config.update({ databaseType, databaseUrl, geminiApiKey });
    const dbStatus = await getDatabaseStatus();

    res.json({
      success: true,
      message: "Server configuration updated successfully!",
      config: updated,
      database: dbStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
