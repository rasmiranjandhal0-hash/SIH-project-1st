/**
 * whatsapp-client.js
 * 
 * Unofficial WhatsApp Web automation client using whatsapp-web.js
 * Uses LocalAuth for persistent session (scan QR once).
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Track client connection state
let isReady = false;
let currentQr = null;

// Resolve Chrome executable on Windows if available
function getChromeExecutablePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return undefined;
}

// Initialize Client with LocalAuth
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.resolve(__dirname, '.wwebjs_auth')
  }),
  puppeteer: {
    headless: true,
    executablePath: getChromeExecutablePath(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

// -----------------------------------------------------------------------------
// Connection Event Listeners
// -----------------------------------------------------------------------------

// 1. QR Code generated (first-time login or session expired)
client.on('qr', (qr) => {
  currentQr = qr;
  isReady = false;
  console.log('\n================================================================');
  console.log('📱 [WhatsApp] Scan this QR Code with your WhatsApp Mobile App:');
  console.log('   (WhatsApp -> Linked Devices -> Link a Device)');
  console.log('================================================================\n');
  qrcode.generate(qr, { small: true });
  console.log('\n[WhatsApp] Waiting for QR scan...');
});

// 2. Authentication successful
client.on('authenticated', () => {
  currentQr = null;
  console.log('🔐 [WhatsApp] Authentication successful! Session saved to .wwebjs_auth');
});

// 3. Authentication failure
client.on('auth_failure', (msg) => {
  isReady = false;
  console.error('❌ [WhatsApp] Authentication failure:', msg);
});

// 4. Client Ready (connected and loaded)
client.on('ready', () => {
  isReady = true;
  currentQr = null;
  const now = new Date().toISOString();
  console.log('================================================================');
  console.log(`✅ [WhatsApp] WhatsApp Web Client is READY! Connected at ${now}`);
  console.log('================================================================');
});

// 5. Client Disconnected
client.on('disconnected', (reason) => {
  isReady = false;
  console.warn(`⚠️ [WhatsApp] Client was disconnected: ${reason}`);
  console.log('[WhatsApp] Re-initializing client session...');
  setTimeout(() => {
    try {
      client.initialize();
    } catch (err) {
      console.error('[WhatsApp] Reconnection error:', err.message);
    }
  }, 5000);
});

// -----------------------------------------------------------------------------
// Core Send Function with In-Memory Retry
// -----------------------------------------------------------------------------

/**
 * Normalizes a phone number to standard international WhatsApp format
 * (e.g., "919XXXXXXXXX" or "919876543210")
 * @param {string|number} number 
 * @returns {string|null}
 */
function normalizePhoneNumber(number) {
  if (!number) return null;
  let clean = String(number).replace(/\D/g, '');
  
  // If 10-digit Indian phone number without country code, prefix with 91
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  
  return clean.length >= 10 ? clean : null;
}

/**
 * Sends a WhatsApp text message to a specific phone number
 * @param {string|number} number - e.g. "919668317798" or "+91 9668317798"
 * @param {string} message - Text content of the message
 * @param {boolean} isRetry - Internal flag for retry logic
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendWhatsApp(number, message, isRetry = false) {
  const cleanNumber = normalizePhoneNumber(number);

  if (!cleanNumber) {
    console.error(`❌ [WhatsApp] Invalid phone number provided: "${number}"`);
    return { success: false, error: `Invalid phone number: ${number}` };
  }

  if (!isReady) {
    console.warn(`⚠️ [WhatsApp] Cannot send message to ${cleanNumber}: WhatsApp client is not ready yet.`);
    return { success: false, error: 'WhatsApp client not ready. Please scan the QR code first.' };
  }

  const chatId = `${cleanNumber}@c.us`;

  try {
    const sentMsg = await client.sendMessage(chatId, message);
    console.log(`✉️ [WhatsApp] Message sent to ${cleanNumber} (MsgID: ${sentMsg?.id?.id || 'OK'})`);
    return {
      success: true,
      messageId: sentMsg?.id?.id || null,
      to: cleanNumber
    };
  } catch (err) {
    console.error(`❌ [WhatsApp] Error sending to ${cleanNumber}:`, err.message);

    // Queue / retry once on failure (simple in-memory retry)
    if (!isRetry) {
      console.log(`🔄 [WhatsApp] Retrying message to ${cleanNumber} in 2.5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2500));
      return sendWhatsApp(number, message, true);
    }

    // Log failure without crashing process
    return {
      success: false,
      error: err.message,
      to: cleanNumber
    };
  }
}

/**
 * Helper to get current status of the WhatsApp client
 */
function getClientStatus() {
  return {
    isReady,
    hasQr: Boolean(currentQr),
    currentQr
  };
}

// Export functions and client instance
module.exports = {
  client,
  sendWhatsApp,
  normalizePhoneNumber,
  getClientStatus,
  isClientReady: () => isReady
};
