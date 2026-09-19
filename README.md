# ✨ KAARIGAR AI
### Two Dedicated Standalone Websites for India’s Artisans & Buyers

> **“Kaarigar AI is a virtual business manager for India’s artisans and weavers, using AI to turn a simple product photo and voice description into a professional, priced, multilingual digital listing.”**
>
> **Core Principle**: *The artisan should focus on making the product. Kaarigar AI should handle the digital business work.*

---

## 🌐 The 2 Distinct Websites

The platform now runs as **two separate, dedicated websites** from the same server and central database:

### 1. 🔨 The Artisan Website (Virtual Business Manager)
- **URL**: **[`http://localhost:5000/artisan`](http://localhost:5000/artisan)**
- **Files**: [`public/artisan.html`](file:///c:/Users/rasmi/OneDrive/Documents/New%20Folder/public/artisan.html) & [`public/js/artisan.js`](file:///c:/Users/rasmi/OneDrive/Documents/New%20Folder/public/js/artisan.js)
- **Built for**: Rural artisans, weavers, and Self-Help Groups (SHGs).
- **Features**:
  - Voice-first, icon-driven, low-literacy interface.
  - **Audio Guidance Button ("सुनें")**: Speaks Hindi instructions aloud.
  - **Engine A (AI Image Studio)**: 📷 Photo capture with Before/After studio lighting enhancement.
  - **Engine B (Multilingual Auto-Cataloger)**: 🎤 Giant pulsing mic with Hindi speech recognition; generates parallel English and Hindi listings.
  - **Engine C (Dynamic Pricing Assistant)**: ₹ Suggested Price Range (e.g., ₹240 – ₹340, Recommended: ₹280) with 100% direct artisan payout.
  - **Festival Demand Forecasting**: Proactive seasonal alerts (e.g. Diwali in 42 days, +240% demand surge).
  - **Cluster & SHG Mode**: Collective catalog management for village self-help groups.
  - **Pictorial Order Status**: 📦 Pack $\rightarrow$ 🚚 Courier $\rightarrow$ 💰 Bank Paid.
  - **WhatsApp Bot Simulator**: Demonstrates voice-note-to-storefront workflow.

---

### 2. 🛍️ The Buyer Storefront Website
- **URL**: **[`http://localhost:5000/`](http://localhost:5000/)** (or **[`http://localhost:5000/store`](http://localhost:5000/store)**)
- **Files**: [`public/index.html`](file:///c:/Users/rasmi/OneDrive/Documents/New%20Folder/public/index.html) & [`public/js/buyer.js`](file:///c:/Users/rasmi/OneDrive/Documents/New%20Folder/public/js/buyer.js)
- **Built for**: Urban and global consumers, patrons, interior designers, and corporate gifters.
- **Features**:
  - Full authentic craft catalog with studio photography.
  - Realistic, accessible prices (₹280, ₹320, ₹420, ₹650, ₹720).
  - **Artisan Provenance Certificate**: Every product card has a certificate modal displaying the maker's generational lineage, village GPS coordinates, and a playable voice note blessing.
  - Shopping Cart & direct checkout where **88% of payment routes straight to the village maker**.

---

## 🚀 How to Run Locally

```powershell
npm start
```
Open in your browser:
- Open the **Artisan App**: **`http://localhost:5000/artisan`**
- Open the **Buyer Store**: **`http://localhost:5000/`**

When an artisan adds or publishes an item on the Artisan App, it **instantly appears on the Buyer Store in real-time**!

---

## 📱 Connecting Multiple Devices
Both websites are accessible across your local Wi-Fi or mobile hotspot at `http://<YOUR-IP>:5000/` and `http://<YOUR-IP>:5000/artisan`.
Click the **"Connect Phone"** button in the header of either website to scan the on-screen QR code with your phone camera!
