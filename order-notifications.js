/**
 * order-notifications.js
 * 
 * Order event triggers for WhatsApp notifications
 * Notifies Seller, Delivery Agent, Company, and Customer based on order lifecycle events.
 */

const dotenv = require('dotenv');
const { sendWhatsApp } = require('./whatsapp-client');

// Load .env configuration
dotenv.config();

// Recipient phone numbers from environment variables
const SELLER_NUMBER = process.env.SELLER_NUMBER || '917815028355';
const DELIVERY_AGENT_NUMBER = process.env.DELIVERY_AGENT_NUMBER || '919668317798';
const COMPANY_NUMBER = process.env.COMPANY_NUMBER || '916371205518';

/**
 * Normalizes input order object to expected standard shape:
 * { id, customerName, customerPhone, address, items, total, status }
 */
function normalizeOrder(order = {}) {
  const id = order.id || order.orderId || `ORD-${Date.now().toString(36).toUpperCase()}`;
  const customerName = order.customerName || order.name || 'Valued Customer';
  const customerPhone = order.customerPhone || order.phone || order.contactPhone || '';
  const address = order.address || order.deliveryAddress || 'Customer Address';

  // Format items representation
  let itemsStr = '';
  if (Array.isArray(order.items)) {
    itemsStr = order.items.map(item => {
      if (typeof item === 'string') return item;
      const title = item.title || item.productTitle || item.name || 'Craft';
      const qty = item.quantity || item.qty || 1;
      return `${title} (x${qty})`;
    }).join(', ');
  } else if (typeof order.items === 'string') {
    itemsStr = order.items;
  } else if (order.productTitle) {
    itemsStr = `${order.productTitle} (x${order.quantity || 1})`;
  } else {
    itemsStr = 'Artisanal Craft';
  }

  const total = order.total !== undefined ? order.total : (order.amount !== undefined ? order.amount : 0);
  const status = order.status || 'placed';

  return {
    id,
    customerName,
    customerPhone,
    address,
    items: itemsStr,
    total,
    status
  };
}

/**
 * Triggered whenever a new order is placed.
 * Dispatches 4 distinct notifications:
 * 1. SELLER_NUMBER
 * 2. DELIVERY_AGENT_NUMBER
 * 3. COMPANY_NUMBER
 * 4. Customer (if customerPhone provided)
 * 
 * @param {object} rawOrder - Order details
 * @returns {Promise<{results: Array, order: object}>}
 */
async function onOrderPlaced(rawOrder) {
  const order = normalizeOrder(rawOrder);
  const results = [];

  console.log(`📦 [Notifications] Processing onOrderPlaced for Order #${order.id}...`);

  // 1. Notify Seller
  const sellerMessage = `New order #${order.id} from ${order.customerName}, items: ${order.items}, total: ₹${order.total}`;
  const sellerRes = await sendWhatsApp(SELLER_NUMBER, sellerMessage);
  results.push({ recipient: 'SELLER', number: SELLER_NUMBER, ...sellerRes });

  // 2. Notify Delivery Agent
  const deliveryMessage = `New order #${order.id} to deliver to ${order.address}, contact: ${order.customerPhone || 'N/A'}`;
  const deliveryRes = await sendWhatsApp(DELIVERY_AGENT_NUMBER, deliveryMessage);
  results.push({ recipient: 'DELIVERY_AGENT', number: DELIVERY_AGENT_NUMBER, ...deliveryRes });

  // 3. Notify Company
  const companyMessage = `New order #${order.id} placed, ₹${order.total}`;
  const companyRes = await sendWhatsApp(COMPANY_NUMBER, companyMessage);
  results.push({ recipient: 'COMPANY', number: COMPANY_NUMBER, ...companyRes });

  // 4. Notify Customer (if customer phone is available)
  if (order.customerPhone) {
    const customerMessage = `Hi ${order.customerName}, your order #${order.id} has been placed. Total: ₹${order.total}. We'll update you on WhatsApp.`;
    const customerRes = await sendWhatsApp(order.customerPhone, customerMessage);
    results.push({ recipient: 'CUSTOMER', number: order.customerPhone, ...customerRes });
  } else {
    console.log(`ℹ️ [Notifications] Customer phone not provided for Order #${order.id}, skipping customer WhatsApp notification.`);
  }

  return {
    success: true,
    orderId: order.id,
    order,
    results
  };
}

/**
 * Triggered whenever an existing order's status changes.
 * Sends a status-specific message to the customer.
 * 
 * Supported statuses:
 * - "packed"
 * - "shipped"
 * - "out_for_delivery"
 * - "delivered"
 * - "cancelled"
 * 
 * @param {object} rawOrder - Order details
 * @param {string} newStatus - New status key
 * @returns {Promise<{success: boolean, result?: object, error?: string}>}
 */
async function onOrderStatusChange(rawOrder, newStatus) {
  const order = normalizeOrder(rawOrder);
  const normalizedStatus = String(newStatus || order.status || '').toLowerCase().trim();

  if (!order.customerPhone) {
    console.warn(`⚠️ [Notifications] Cannot notify customer for Order #${order.id}: no customerPhone.`);
    return { success: false, error: 'No customerPhone provided' };
  }

  let message = '';
  switch (normalizedStatus) {
    case 'packed':
      message = `Hi ${order.customerName}, your order #${order.id} has been packed with care and is ready for pickup.`;
      break;
    case 'shipped':
      message = `Hi ${order.customerName}, your order #${order.id} has been shipped and is on its way to you.`;
      break;
    case 'out_for_delivery':
      message = `Hi ${order.customerName}, your order #${order.id} is out for delivery today. Our delivery agent will contact you shortly.`;
      break;
    case 'delivered':
      message = `Hi ${order.customerName}, your order #${order.id} has been delivered. Thank you for your purchase!`;
      break;
    case 'cancelled':
      message = `Hi ${order.customerName}, your order #${order.id} has been cancelled. If you have any questions, please contact our support.`;
      break;
    default:
      message = `Hi ${order.customerName}, the status of your order #${order.id} has been updated to: ${newStatus}.`;
      break;
  }

  console.log(`🔄 [Notifications] Sending onOrderStatusChange (${normalizedStatus}) for Order #${order.id} to ${order.customerPhone}...`);
  const sendRes = await sendWhatsApp(order.customerPhone, message);

  return {
    success: sendRes.success,
    orderId: order.id,
    status: normalizedStatus,
    customerPhone: order.customerPhone,
    message,
    sendResult: sendRes
  };
}

module.exports = {
  onOrderPlaced,
  onOrderStatusChange,
  normalizeOrder,
  getConfig: () => ({
    SELLER_NUMBER,
    DELIVERY_AGENT_NUMBER,
    COMPANY_NUMBER
  })
};
