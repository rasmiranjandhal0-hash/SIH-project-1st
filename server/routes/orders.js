const express = require('express');
const router = express.Router();
const { db } = require('../db');
const whatsappService = require('../services/whatsappService');
const { onOrderPlaced, onOrderStatusChange } = require('../../order-notifications');
const { syncOrderToSupabase } = require('../supabase');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const orders = await db.getAllOrders();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create an order (Cart checkout or B2B Corporate inquiry)
router.post('/', async (req, res) => {
  try {
    const { productId, quantity, customerName, customerEmail, customerPhone, deliveryAddress, paymentMethod } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    const order = await db.createOrder({
      productId,
      quantity: Number(quantity) || 1,
      customerName: customerName || "Patron Collector",
      customerEmail: customerEmail || "buyer@kalasetu.org",
      customerPhone: customerPhone || "919876543210",
      deliveryAddress: deliveryAddress || "Direct Express Delivery",
      paymentMethod: paymentMethod || "UPI Instant Direct Settlement"
    });

    const products = await db.getAllProducts();
    const product = products.find(p => p.id === productId);

    // 1. Dual dispatch with click-to-chat preview
    const dispatch = whatsappService.dispatchOrderNotifications(order, product);

    // 2. Automated whatsapp-web.js trigger (notifies Seller, Delivery Agent, Company, and Customer)
    onOrderPlaced(order).catch(err => {
      console.warn('[WhatsAppWeb] Automated dispatch deferred:', err.message);
    });

    // 3. Asynchronously sync to Supabase cloud database
    syncOrderToSupabase(order).catch(err => {
      console.warn('[Supabase] Sync deferred:', err.message);
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully. Dual WhatsApp notifications dispatched to Delivery Partner and Company HQ!",
      data: order,
      whatsappDispatch: dispatch
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id/status - Update status and trigger WhatsApp customer notification
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const orders = await db.getAllOrders();
    const order = orders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ success: false, error: `Order ${id} not found` });
    }

    order.status = status;
    db.saveOrders();

    // Trigger WhatsApp notification for: packed, shipped, out_for_delivery, delivered, cancelled
    const notifResult = await onOrderStatusChange(order, status);

    // Sync status change to Supabase
    syncOrderToSupabase(order).catch(() => {});

    res.json({
      success: true,
      message: `Order status updated to ${status}. Customer notification triggered.`,
      order,
      notification: notifResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders/webhook/supabase - Webhook listener for Supabase Database Events
router.post('/webhook/supabase', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[Supabase Webhook] Received event:', payload.type || 'UNKNOWN');

    const record = payload.record || payload;
    const oldRecord = payload.old_record;

    if (!record || !record.id) {
      return res.status(400).json({ success: false, error: 'Invalid webhook record payload' });
    }

    // Map Supabase snake_case columns to camelCase
    const order = {
      id: record.id,
      customerName: record.customer_name || record.customerName || 'Customer',
      customerPhone: record.customer_phone || record.customerPhone || '',
      address: record.delivery_address || record.address || 'Address',
      items: record.product_title || record.items || 'Craft Item',
      total: record.amount || record.total || 0,
      status: record.status || 'placed'
    };

    if (payload.type === 'INSERT' || !oldRecord) {
      // New order placed -> Trigger 4 WhatsApp notifications
      await onOrderPlaced(order);
    } else if (payload.type === 'UPDATE' && record.status !== oldRecord.status) {
      // Status updated -> Trigger customer notification
      await onOrderStatusChange(order, record.status);
    }

    res.json({ success: true, message: 'Supabase webhook processed successfully' });
  } catch (err) {
    console.error('[Supabase Webhook] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
