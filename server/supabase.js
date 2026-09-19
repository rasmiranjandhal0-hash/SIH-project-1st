/**
 * server/supabase.js
 * 
 * Supabase client and sync helpers for KAARIGAR AI.
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

let supabase = null;

if (config.supabaseUrl && config.supabaseKey) {
  try {
    supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    console.log(`[Supabase] Client initialized for project: ${config.supabaseUrl}`);
  } catch (err) {
    console.error('[Supabase] Initialization error:', err.message);
  }
}

/**
 * Sync an order to Supabase orders table
 * @param {object} order 
 */
async function syncOrderToSupabase(order) {
  if (!supabase) return { success: false, error: 'Supabase not initialized' };

  try {
    const { data, error } = await supabase
      .from('orders')
      .upsert({
        id: order.id,
        customer_name: order.customerName || order.customer_name,
        customer_email: order.customerEmail || order.customer_email || null,
        customer_phone: order.customerPhone || order.customer_phone || null,
        product_id: order.productId || order.product_id,
        product_title: order.productTitle || order.product_title || 'Craft Item',
        quantity: order.quantity || 1,
        amount: order.amount || order.total || 0,
        artisan_share: order.artisanShare || Math.round((order.amount || 0) * 0.88),
        status: order.status || 'placed',
        payment_method: order.paymentMethod || 'UPI (6371205518@upi)',
        delivery_address: order.deliveryAddress || order.address || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      // If table doesn't exist yet, log helpful hint without crashing
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        console.warn(`[Supabase] Table 'public.orders' not found yet in Supabase. (Order saved locally to embedded storage).`);
        return { success: false, error: 'Table public.orders does not exist yet', code: 'TABLE_NOT_FOUND' };
      }
      console.warn(`[Supabase] Sync warning for Order #${order.id}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`☁️ [Supabase] Order #${order.id} successfully synced to cloud database!`);
    return { success: true, data };
  } catch (err) {
    console.warn(`[Supabase] Sync exception:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Check Supabase connection and table availability
 */
async function checkSupabaseHealth() {
  if (!supabase) {
    return {
      configured: false,
      status: 'NOT_CONFIGURED'
    };
  }

  try {
    const { data, error } = await supabase.from('orders').select('id').limit(1);
    if (error) {
      return {
        configured: true,
        url: config.supabaseUrl,
        status: error.code === 'PGRST205' ? 'TABLE_MISSING' : 'ERROR',
        message: error.message,
        tableCreated: false
      };
    }
    return {
      configured: true,
      url: config.supabaseUrl,
      status: 'CONNECTED',
      tableCreated: true
    };
  } catch (err) {
    return {
      configured: true,
      url: config.supabaseUrl,
      status: 'EXCEPTION',
      message: err.message,
      tableCreated: false
    };
  }
}

module.exports = {
  supabase,
  syncOrderToSupabase,
  checkSupabaseHealth
};
