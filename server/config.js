const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env file from root
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  databaseType: process.env.DATABASE_TYPE || 'embedded', // 'embedded' | 'mongodb' | 'postgres'
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/kalasetu',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  companyUpiId: process.env.COMPANY_UPI_ID || '6371205518@upi',
  deliveryPartnerPhone: process.env.DELIVERY_PARTNER_PHONE || '+91 9668317798',
  companyPhone: process.env.COMPANY_PHONE || '+91 6371205518',
  supabaseUrl: process.env.SUPABASE_URL || 'https://ajezwthyvnsrgwxzrwqk.supabase.co',
  supabaseKey: process.env.SUPABASE_KEY || 'sb_publishable__-XEzz9gUnABnCvjgD07iA_h1UZw19S',
  paypalClientId: process.env.PAYPAL_CLIENT_ID || 'test',
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  paypalCurrency: process.env.PAYPAL_CURRENCY || 'USD',
  inrToUsdRate: parseFloat(process.env.INR_TO_USD_RATE) || 0.012,
  nodeEnv: process.env.NODE_ENV || 'development',
  dataDir: path.resolve(__dirname, 'data'),
  uploadDir: path.resolve(__dirname, '../public/uploads'),
  
  // Method to update config at runtime from UI or API
  update(newConfig) {
    if (newConfig.databaseType) this.databaseType = newConfig.databaseType;
    if (newConfig.databaseUrl) this.databaseUrl = newConfig.databaseUrl;
    if (newConfig.geminiApiKey !== undefined) this.geminiApiKey = newConfig.geminiApiKey;
    if (newConfig.paypalClientId !== undefined) this.paypalClientId = newConfig.paypalClientId;
    if (newConfig.companyUpiId !== undefined) this.companyUpiId = newConfig.companyUpiId;
    if (newConfig.deliveryPartnerPhone !== undefined) this.deliveryPartnerPhone = newConfig.deliveryPartnerPhone;
    if (newConfig.companyPhone !== undefined) this.companyPhone = newConfig.companyPhone;
    return this.getPublicConfig();
  },

  // Safe config object to expose to frontend / admin dashboard (hides full API keys)
  getPublicConfig() {
    return {
      port: this.port,
      host: this.host,
      databaseType: this.databaseType,
      databaseUrlConfigured: Boolean(this.databaseUrl),
      databaseUrlMasked: this.databaseUrl ? this.databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@') : 'None',
      hasGeminiApiKey: Boolean(this.geminiApiKey && this.geminiApiKey.trim().length > 5),
      companyUpiId: this.companyUpiId,
      deliveryPartnerPhone: this.deliveryPartnerPhone,
      companyPhone: this.companyPhone,
      paypalClientId: this.paypalClientId,
      paypalCurrency: this.paypalCurrency,
      inrToUsdRate: this.inrToUsdRate,
      nodeEnv: this.nodeEnv
    };
  }
};

module.exports = config;
