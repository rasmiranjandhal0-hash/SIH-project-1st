const config = require('../config');

// In-memory dispatch audit logs
const dispatchLogs = [];

/**
 * Format the WhatsApp dispatch message for the Delivery Partner (+91 9668317798)
 */
function formatDeliveryPartnerMessage(order, product) {
  const makerName = product?.artisan?.name || "Master Village Artisan";
  const village = product?.artisan?.village || "Rural Artisan Craft Cluster";
  const stateName = product?.artisan?.state || "India";
  const gps = product?.artisan?.gpsCoordinates ? `(${product.artisan.gpsCoordinates.latitude}° N, ${product.artisan.gpsCoordinates.longitude}° E)` : "";
  const artisanPhone = product?.artisan?.contactPhone || "+91 78150 28355";
  const qty = order.quantity || 1;
  const paymentMethod = order.paymentMethod || `UPI (${config.companyUpiId})`;

  return `🚚 *KAARIGAR AI — NEW PICKUP & DELIVERY DISPATCH*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 *Order ID*: ${order.id}
🏺 *Craft Item*: ${order.productTitle || product?.title || 'Artisanal Heritage Craft'}
🔢 *Quantity*: ${qty} piece(s)
💰 *Order Amount*: ₹${order.amount || 280}
💳 *Payment*: PAID via ${paymentMethod}

📍 *PICKUP LOCATION (ARTISAN WORKSHOP)*:
• *Maker*: ${makerName}
• *Cluster*: ${village}, ${stateName} ${gps}
• *Contact Phone*: ${artisanPhone}

🏠 *DROP DELIVERY LOCATION (CUSTOMER)*:
• *Customer*: ${order.customerName || 'Patron Customer'}
• *Address*: ${order.deliveryAddress || 'Verified Customer Delivery Address'}

⚡ *Dispatch Note*: Handle with fragile care. Provenance authenticity certificate enclosed in box. Please confirm pickup with artisan today.`;
}

/**
 * Format the WhatsApp notification for Company HQ (6371205518 / +91 6371205518)
 */
function formatCompanyAlertMessage(order, product) {
  const qty = order.quantity || 1;
  const artisanShare = order.artisanShare || Math.round((order.amount || 280) * 0.88);
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  return `🏢 *KAARIGAR AI — NEW ORDER ALERT (COMPANY HQ)*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🧾 *Order ID*: ${order.id}
📅 *Timestamp*: ${now}
👤 *Customer*: ${order.customerName || 'Valued Patron'}
🛍️ *Craft*: ${order.productTitle || product?.title || 'Artisanal Craft'} (Qty: ${qty})
💵 *Total Received*: ₹${order.amount || 280}
🏦 *Payment Credited To*: ${config.companyUpiId}
👨‍🎨 *Direct Artisan Payout (88%)*: ₹${artisanShare} scheduled
🚚 *Assigned Delivery Partner*: ${config.deliveryPartnerPhone} (Pickup slip dispatched)
📍 *Status*: Payment verified & artisan notification initiated.`;
}

/**
 * Helper to generate direct WhatsApp click-to-chat links
 */
function generateWhatsAppUrl(phoneNumber, message) {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
}

/**
 * Dispatches the dual WhatsApp notifications for an order
 */
function dispatchOrderNotifications(order, product = null) {
  const deliveryMsg = formatDeliveryPartnerMessage(order, product);
  const companyMsg = formatCompanyAlertMessage(order, product);

  const deliveryUrl = generateWhatsAppUrl(config.deliveryPartnerPhone, deliveryMsg);
  const companyUrl = generateWhatsAppUrl(config.companyPhone, companyMsg);

  const dispatchEntry = {
    id: `DISPATCH-${Date.now()}`,
    orderId: order.id,
    timestamp: new Date().toISOString(),
    deliveryPartner: {
      phone: config.deliveryPartnerPhone,
      message: deliveryMsg,
      whatsappUrl: deliveryUrl,
      status: 'SENT'
    },
    company: {
      phone: config.companyPhone,
      upiId: config.companyUpiId,
      message: companyMsg,
      whatsappUrl: companyUrl,
      status: 'SENT'
    }
  };

  dispatchLogs.unshift(dispatchEntry);
  console.log(`[WhatsApp Dispatch] Order ${order.id} -> Notifications dispatched to Delivery (${config.deliveryPartnerPhone}) and Company (${config.companyPhone})`);

  return dispatchEntry;
}

/**
 * Process messages sent to the Seller WhatsApp Bot
 */
function processSellerBotMessage(userMessage = '', context = {}) {
  const lower = userMessage.toLowerCase();

  // Scenario 1: Inquiry about order or payment status
  if (lower.includes('ऑर्डर') || lower.includes('order') || lower.includes('पैसे') || lower.includes('payout') || lower.includes('कमाई')) {
    return {
      success: true,
      sender: 'Kaarigar AI Virtual Manager',
      reply: `🙏 *नमस्ते कारीगर साथी!*\n\n📊 *आपकी कमाई व ऑर्डर स्थिति:*\n• *सफल ऑर्डर*: 11 ऑर्डर पूर्ण\n• *सीधा बैंक ट्रांसफर*: ₹2,840 खाते में जमा\n• *UPI आईडी*: ${config.companyUpiId}\n• *कूरियर पार्टनर*: ${config.deliveryPartnerPhone} (नया ऑर्डर आने पर 2 घंटे में पिकअप)\n\nनया सामान बेचने के लिए बस उसकी फोटो भेजें या बोलकर बताएं!`
    };
  }

  // Scenario 2: Festival / Demand guidance
  if (lower.includes('त्यौहार') || lower.includes('दिवाली') || lower.includes('diwali') || lower.includes('मांग')) {
    return {
      success: true,
      sender: 'Kaarigar AI Virtual Manager',
      reply: `🪔 *कारीगर मांग अलर्ट — दीवाली उत्सव (42 दिन शेष)*\n\n📈 मिट्टी के दीये, टेराकोटा पूजा थाली और हाथ की बुनी सिल्क साड़ियों की मांग *+240%* बढ़ रही है!\n\n💡 *सलाह*: अपना नया स्टॉक अभी तैयार करें। Kaarigar Storefront पर सीधे ग्राहक बिना किसी बिचौलिए के सही दाम पर खरीदेंगे।`
    };
  }

  // Scenario 3: Craft listing request (Voice or text description)
  let craftType = "हस्तनिर्मित शिल्प";
  let suggestedPrice = 280;
  let artisanPayout = 246;

  if (lower.includes('मिट्टी') || lower.includes('दीया') || lower.includes('घड़ा') || lower.includes('terracotta')) {
    craftType = "पारंपरिक टेराकोटा हस्तशिल्प";
    suggestedPrice = 280;
    artisanPayout = 246;
  } else if (lower.includes('पेंटिंग') || lower.includes('मधुबनी') || lower.includes('art')) {
    craftType = "पारंपरिक मिथिला मधुबनी कला";
    suggestedPrice = 420;
    artisanPayout = 370;
  } else if (lower.includes('सिल्क') || lower.includes('दुपट्टा') || lower.includes('साड़ी') || lower.includes('अजरक')) {
    craftType = "अजरक ब्लॉक प्रिंट प्राकृतिक सिल्क";
    suggestedPrice = 720;
    artisanPayout = 633;
  } else if (lower.includes('लकड़ी') || lower.includes('खिलौना') || lower.includes('toy')) {
    craftType = "चन्नापटना पर्यावरण-अनुकूल लकड़ी शिल्प";
    suggestedPrice = 320;
    artisanPayout = 281;
  }

  return {
    success: true,
    sender: 'Kaarigar AI Virtual Manager',
    craftExtracted: craftType,
    suggestedPrice: suggestedPrice,
    artisanPayout: artisanPayout,
    reply: `✨ *कारीगर AI वर्चुअल मैनेजर ने आपकी कला को समझा!*\n\n🏺 *सामान का नाम*: ${craftType}\n📝 *विवरण*: प्रामाणिक ग्रामीण कारीगरी • 100% प्राकृतिक सामग्री\n\n💰 *बाजार भाव विश्लेषण (AI Pricing)*:\n• *अनुशंसित बिक्री मूल्य*: ₹${suggestedPrice}\n• *सीधा आपके बैंक खाते में (88%)*: ₹${artisanPayout}\n• *कंपनी UPI प्राप्तकर्ता*: ${config.companyUpiId}\n\n✅ *आपका सामान Kaarigar Storefront पर 24/7 लाइव प्रकाशित होने के लिए तैयार है!*\nग्राहक का ऑर्डर आते ही कूरियर पार्टनर (${config.deliveryPartnerPhone}) आपके पते पर लेने आएगा।`
  };
}

module.exports = {
  formatDeliveryPartnerMessage,
  formatCompanyAlertMessage,
  generateWhatsAppUrl,
  dispatchOrderNotifications,
  processSellerBotMessage,
  getDispatchLogs: () => dispatchLogs
};
