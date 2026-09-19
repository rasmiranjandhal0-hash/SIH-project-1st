const fs = require('fs');
const path = require('path');
const config = require('./config');
const { seedProducts, seedOrders } = require('./data/seedData');

const productsFilePath = path.join(config.dataDir, 'products.json');
const ordersFilePath = path.join(config.dataDir, 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

// Memory cache & file synchronization
class EmbeddedDB {
  constructor() {
    this.products = [];
    this.orders = [];
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(productsFilePath)) {
        const raw = fs.readFileSync(productsFilePath, 'utf-8');
        this.products = JSON.parse(raw);
      } else {
        this.products = [...seedProducts];
        this.saveProducts();
      }

      if (fs.existsSync(ordersFilePath)) {
        const raw = fs.readFileSync(ordersFilePath, 'utf-8');
        this.orders = JSON.parse(raw);
      } else {
        this.orders = [...seedOrders];
        this.saveOrders();
      }
      console.log(`[Database] Embedded Local Storage Initialized: ${this.products.length} products, ${this.orders.length} orders.`);
    } catch (err) {
      console.error('[Database] Initialization error, recovering with seed data:', err.message);
      this.products = [...seedProducts];
      this.orders = [...seedOrders];
    }
  }

  saveProducts() {
    try {
      fs.writeFileSync(productsFilePath, JSON.stringify(this.products, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Error saving products:', err.message);
    }
  }

  saveOrders() {
    try {
      fs.writeFileSync(ordersFilePath, JSON.stringify(this.orders, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Error saving orders:', err.message);
    }
  }

  async getAllProducts(query = {}) {
    let list = [...this.products];
    if (query.category && query.category !== 'All') {
      list = list.filter(p => p.category.toLowerCase().includes(query.category.toLowerCase()));
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.story.toLowerCase().includes(q) ||
        p.artisan.village.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (query.dropOnly === 'true') {
      list = list.filter(p => p.isFeaturedDrop);
    }
    return list;
  }

  async getProductById(id) {
    return this.products.find(p => p.id === id) || null;
  }

  async addProduct(product) {
    const newProduct = {
      id: `art-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      stockRemaining: product.stockRemaining || 5,
      totalBatchSize: product.totalBatchSize || 10,
      dropEndsIn: product.dropEndsIn || "24h 00m",
      isFeaturedDrop: Boolean(product.isFeaturedDrop !== false),
      provenance: {
        certificateId: `KG-IND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        blockchainSeal: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 6)}`,
        material: product.material || "Locally sourced natural earth & organic fibers",
        firingMethod: product.firingMethod || "Handcrafted traditional slow kiln",
        daysToCraft: product.daysToCraft || 3
      },
      ...product
    };
    this.products.unshift(newProduct);
    this.saveProducts();
    return newProduct;
  }

  async getAllOrders() {
    return [...this.orders].reverse();
  }

  async createOrder(orderData) {
    const product = await this.getProductById(orderData.productId);
    const amount = product ? product.price * (orderData.quantity || 1) : orderData.amount || 1500;
    const artisanShare = product ? Math.round(product.artisanPayout * (orderData.quantity || 1)) : Math.round(amount * 0.88);

    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: orderData.customerName || "Corporate / Patron Buyer",
      customerEmail: orderData.customerEmail || "patron@kalasetu.org",
      productId: orderData.productId,
      productTitle: product ? product.title : orderData.productTitle || "Artisanal Heritage Craft",
      quantity: orderData.quantity || 1,
      amount: amount,
      artisanShare: artisanShare,
      status: orderData.paymentStatus === 'PAID' ? "Paid & Direct Maker Payout Scheduled" : "Processing Order & Direct Artisan Notification",
      paymentStatus: orderData.paymentStatus || (orderData.paymentMethod?.includes('PayPal') ? 'PAID' : 'PENDING'),
      orderDate: new Date().toISOString().split('T')[0],
      paymentMethod: orderData.paymentMethod || `UPI (${config.companyUpiId})`,
      upiReceiver: config.companyUpiId,
      deliveryPartnerPhone: config.deliveryPartnerPhone,
      companyPhone: config.companyPhone,
      paypalDetails: orderData.paypalDetails || null,
      deliveryAddress: orderData.deliveryAddress || "Standard National Delivery"
    };

    // Decrement stock if product exists
    if (product && product.stockRemaining > 0) {
      product.stockRemaining = Math.max(0, product.stockRemaining - newOrder.quantity);
      this.saveProducts();
    }

    this.orders.push(newOrder);
    this.saveOrders();
    return newOrder;
  }

  async getStats() {
    const totalSales = this.orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalArtisanPayout = this.orders.reduce((sum, o) => sum + (o.artisanShare || 0), 0);
    return {
      activeProductsCount: this.products.length,
      totalOrdersCount: this.orders.length,
      totalGrossSales: totalSales,
      totalDirectToArtisans: totalArtisanPayout,
      artisanPayoutPercentage: totalSales > 0 ? ((totalArtisanPayout / totalSales) * 100).toFixed(1) + '%' : '88.2%'
    };
  }
}

// Instantiate singleton database
const dbInstance = new EmbeddedDB();

module.exports = {
  db: dbInstance,
  getDatabaseStatus: async () => {
    const stats = await dbInstance.getStats();
    return {
      activeType: config.databaseType,
      storageMode: config.databaseType === 'embedded' ? 'Local JSON Persistent Storage (Zero-Setup)' : `${config.databaseType.toUpperCase()} External Database`,
      storagePath: productsFilePath,
      isHealthy: true,
      stats: stats,
      databaseUrlConfigured: Boolean(config.databaseUrl)
    };
  }
};
