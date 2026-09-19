# WhatsApp Web Automation Backend Service (`whatsapp-web.js`)

Lightweight, reliable WhatsApp order notification service using [whatsapp-web.js](https://wwebjs.dev/) with **LocalAuth** session persistence. No Meta Business API or approval needed.

---

## 🚀 1. Installation

Install the required dependencies:

```bash
npm install whatsapp-web.js qrcode-terminal
```

*(Already installed in this project)*

---

## ⚙️ 2. Configuration (`.env`)

Add the following environment variables to your `.env` file with country code prefix (e.g. `91` for India):

```env
SELLER_NUMBER=917815028355
DELIVERY_AGENT_NUMBER=919668317798
COMPANY_NUMBER=916371205518
```

---

## 📱 3. First-Time Setup & QR Code Scan

To scan the QR code and link your WhatsApp account:

1. Run the client initialization script:
   ```bash
   node -e "const { client } = require('./whatsapp-client'); client.initialize();"
   ```
2. A QR code will display in your terminal:
   ```
   ================================================================
   📱 [WhatsApp] Scan this QR Code with your WhatsApp Mobile App:
      (WhatsApp -> Linked Devices -> Link a Device)
   ================================================================
   ```
3. Open WhatsApp on your phone $\rightarrow$ tap **Settings / Three Dots** $\rightarrow$ **Linked Devices** $\rightarrow$ **Link a Device** $\rightarrow$ scan the terminal QR code.
4. Once authenticated, you will see:
   ```
   🔐 [WhatsApp] Authentication successful! Session saved to .wwebjs_auth
   ✅ [WhatsApp] WhatsApp Web Client is READY! Connected at 2026-09-11T...
   ```
5. **No need to scan again!** Thanks to `LocalAuth`, your session token is cached in `.wwebjs_auth/`. The client will automatically authenticate on subsequent server restarts.

---

## 📦 4. Order Schema

The order notification triggers accept an order object with this standard shape:

```javascript
{
  id: "ORD-1042",
  customerName: "Aarav Sharma",
  customerPhone: "919876543210",
  address: "Flat 402, Green Glen Layout, Bellandur, Bengaluru",
  items: "Traditional Terracotta Vase (x1), Madhubani Art (x2)",
  total: 720,
  status: "placed"
}
```

*Note: The functions also automatically handle arrays of items, or schema aliases such as `deliveryAddress`, `amount`, and `productTitle`.*

---

## 🔔 5. Usage in Order Flow

### Event 1: When a New Order is Placed (`onOrderPlaced`)

Call `onOrderPlaced(order)` immediately after saving a new order:

```javascript
const { onOrderPlaced } = require('./order-notifications');

// Example order object
const order = {
  id: "ORD-2045",
  customerName: "Elena Rostova",
  customerPhone: "919876543210",
  address: "Flat 402, Bengaluru",
  items: "Handmade Terracotta Planter (x1)",
  total: 450
};

// Dispatches 4 notifications in parallel
await onOrderPlaced(order);
```

#### Outgoing Messages Dispatched:
| Recipient | Target Phone | Message Format |
|---|---|---|
| **Seller** | `SELLER_NUMBER` | `New order #ORD-2045 from Elena Rostova, items: Handmade Terracotta Planter (x1), total: ₹450` |
| **Delivery Agent** | `DELIVERY_AGENT_NUMBER` | `New order #ORD-2045 to deliver to Flat 402, Bengaluru, contact: 919876543210` |
| **Company HQ** | `COMPANY_NUMBER` | `New order #ORD-2045 placed, ₹450` |
| **Customer** | `customerPhone` | `Hi Elena Rostova, your order #ORD-2045 has been placed. Total: ₹450. We'll update you on WhatsApp.` |

---

### Event 2: When Order Status Changes (`onOrderStatusChange`)

Call `onOrderStatusChange(order, newStatus)` when an order is updated:

```javascript
const { onOrderStatusChange } = require('./order-notifications');

// Available statuses: "packed", "shipped", "out_for_delivery", "delivered", "cancelled"
await onOrderStatusChange(order, "shipped");
```

#### Status-Specific Messages Sent to Customer:
* **`packed`**:  
  `Hi Elena Rostova, your order #ORD-2045 has been packed with care and is ready for pickup.`
* **`shipped`**:  
  `Hi Elena Rostova, your order #ORD-2045 has been shipped and is on its way to you.`
* **`out_for_delivery`**:  
  `Hi Elena Rostova, your order #ORD-2045 is out for delivery today. Our delivery agent will contact you shortly.`
* **`delivered`**:  
  `Hi Elena Rostova, your order #ORD-2045 has been delivered. Thank you for your purchase!`
* **`cancelled`**:  
  `Hi Elena Rostova, your order #ORD-2045 has been cancelled. If you have any questions, please contact our support.`

---

## 🛡️ 6. Reliability & Error Handling

* **Automatic Single Retry**: If sending fails (e.g. temporary socket blip), `sendWhatsApp()` waits 2.5 seconds and retries once.
* **Non-Crashing**: Invalid phone numbers or offline WhatsApp states are caught and logged without crashing the Express server.
* **Health Check Log**: Whenever the client connects or reconnects, connection timestamps and ready events are printed to the console.
