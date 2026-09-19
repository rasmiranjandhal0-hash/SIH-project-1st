const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const aiRoutes = require('./routes/ai');
const serverInfoRoutes = require('./routes/serverInfo');
const demandForecastRoutes = require('./routes/demandForecast');
const paypalRoutes = require('./routes/paypal');
const whatsappRoutes = require('./routes/whatsapp');

const app = express();

// Enable CORS for all external origins, phones, and devices
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/server', serverInfoRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api', demandForecastRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'KAARIGAR AI',
    role: "A Virtual Business Manager for India's Artisans & Weavers",
    time: new Date().toISOString()
  });
});

// Website 1: Artisan Virtual Business Manager Website
app.get('/artisan', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/artisan.html'));
});

// Website 2: Buyer Storefront Marketplace Website
app.get('/store', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Login & Delivery Address Page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// WhatsApp Web Pairing & Status Page
app.get('/whatsapp', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/whatsapp.html'));
});

// Order Confirmed Page
app.get('/order-confirmed', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/order-confirmed.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Fallback middleware
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Server on 0.0.0.0
app.listen(config.port, config.host, () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let networkIp = 'localhost';

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        networkIp = iface.address;
        break;
      }
    }
  }

  console.log('================================================================');
  console.log('  ✨ KAARIGAR AI — Virtual Business Manager for India’s Artisans');
  console.log('================================================================');
  console.log(`  🌐 Local Access:       http://localhost:${config.port}`);
  console.log(`  📱 Mobile / Wi-Fi LAN: http://${networkIp}:${config.port}`);
  console.log(`  💾 Active Database:    ${config.databaseType.toUpperCase()} (Zero-setup persistent)`);
  console.log(`  🤖 AI Engines:         Image Studio • Multilingual Auto-Cataloger • Pricing Assistant`);
  console.log('================================================================');
  console.log('  👉 "The artisan focuses on making. Kaarigar AI handles the business."');
  console.log('================================================================\n');
});
