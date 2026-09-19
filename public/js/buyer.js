/**
 * KAARIGAR STORE — DEDICATED BUYER STOREFRONT CONTROLLER (buyer.js)
 * Authentic Living Indian Handcraft Marketplace
 */

const state = {
  products: [],
  cart: [],
  currentModalProduct: null,
  serverInfo: null,
  paypalConfig: null,
  paypalButtonsRendered: false,
  merchantUpiId: '6371205518@upi',
  deliveryPartnerPhone: '+91 9668317798',
  companyPhone: '+91 6371205518',
  user: null,
  address: null,
  upiMode: null // 'phone' | 'laptop'
};

document.addEventListener('DOMContentLoaded', () => {
  initUserAuthAndAddress();
  fetchProducts();
  fetchServerInfo();
  fetchPayPalConfig();
});

// ==============================================================================
// 1. PRODUCTS CATALOG & FILTERING
// ==============================================================================
async function fetchProducts(category = 'All') {
  try {
    const url = category && category !== 'All' 
      ? `/api/products?category=${encodeURIComponent(category)}`
      : '/api/products';
    
    const res = await fetch(url);
    const result = await res.json();
    if (result.success) {
      state.products = result.data;
      renderProducts(result.data);
    }
  } catch (err) {
    console.error('Failed to fetch products:', err);
    showToast('Failed to load products from store', 'error');
  }
}

function filterCategory(category) {
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.classList.remove('active', 'bg-gold-500', 'text-obsidian');
    btn.classList.add('bg-card', 'text-slate-300');
    if (btn.textContent.includes(category) || (category === 'All' && btn.textContent === 'All Crafts')) {
      btn.classList.add('active', 'bg-gold-500', 'text-obsidian');
      btn.classList.remove('bg-card', 'text-slate-300');
    }
  });
  fetchProducts(category);
}

function handleSearchInput(event) {
  const query = (event.target.value || '').toLowerCase().trim();
  if (!query) {
    renderProducts(state.products);
    return;
  }
  const filtered = state.products.filter(p => {
    return (p.title && p.title.toLowerCase().includes(query)) ||
           (p.category && p.category.toLowerCase().includes(query)) ||
           (p.artisan?.village && p.artisan.village.toLowerCase().includes(query)) ||
           (p.artisan?.name && p.artisan.name.toLowerCase().includes(query)) ||
           (p.story && p.story.toLowerCase().includes(query));
  });
  renderProducts(filtered);
}

function renderProducts(products) {
  const container = document.getElementById('products-grid');
  if (!container) return;

  const countBadge = document.getElementById('catalog-count-badge');
  if (countBadge) {
    countBadge.textContent = `${products.length} craft${products.length !== 1 ? 's' : ''}`;
  }

  if (products.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 sm:py-16 bg-card rounded-2xl sm:rounded-3xl border border-borderDark text-slate-400 space-y-2">
        <i class="fa-solid fa-box-open text-2xl sm:text-3xl text-gold-400/50"></i>
        <p class="text-xs sm:text-sm">No crafts found in this selection.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => {
    const imageSrc = product.images?.studio || product.images?.raw || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';
    return `
      <div class="group bg-card border border-borderDark hover:border-gold-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-gold-500/10">
        
        <div class="relative aspect-square overflow-hidden bg-surface">
          <img src="${imageSrc}" alt="${product.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
          
          <div class="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1">
            <span class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-obsidian/90 backdrop-blur-md text-gold-300 border border-gold-500/30 truncate max-w-[100px] sm:max-w-none">
              <i class="fa-solid fa-stamp text-gold-400"></i> ${product.giTag || 'Direct Artisan'}
            </span>
          </div>

          <button onclick="openProvenanceModal('${product.id}')" class="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-obsidian/85 hover:bg-gold-500 hover:text-obsidian text-slate-200 text-[10px] sm:text-xs font-semibold backdrop-blur-md border border-white/10 transition flex items-center gap-1">
            <i class="fa-solid fa-passport"></i>
            <span class="hidden xs:inline">Cert</span>
          </button>
        </div>

        <div class="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-3">
          <div>
            <div class="text-[9px] sm:text-[11px] font-mono uppercase tracking-wider text-gold-400/90 mb-0.5 truncate">
              ${product.category} • ${product.artisan?.village || 'Artisan Hub'}
            </div>
            <h3 class="font-bold text-white font-luxury text-xs sm:text-base group-hover:text-gold-300 transition line-clamp-1">
              ${product.title}
            </h3>
            <p class="hidden sm:block text-xs text-slate-400 line-clamp-2 mt-1 font-light leading-relaxed">
              ${product.story || product.subtitle}
            </p>
          </div>

          <div class="flex items-center gap-1.5 pt-1.5 border-t border-borderDark/60 text-[10px] sm:text-xs">
            <img src="${product.artisan?.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80'}" class="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-gold-500/30 flex-shrink-0">
            <span class="truncate text-slate-300 font-medium">${product.artisan?.name}</span>
            <span class="text-[9px] sm:text-[10px] text-emerald-400 font-semibold ml-auto flex-shrink-0">₹${product.artisanPayout} direct</span>
          </div>

          <div class="pt-1 flex items-center justify-between gap-1">
            <div>
              <span class="text-[10px] sm:text-xs text-slate-400 line-through mr-1">₹${product.marketPrice || Math.round(product.price * 1.8)}</span>
              <span class="text-sm sm:text-xl font-bold text-gold-400 font-luxury">₹${product.price}</span>
            </div>
            <button onclick="addToCart('${product.id}')" class="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-gold-500/20 hover:bg-gold-500 text-gold-300 hover:text-obsidian text-xs font-bold transition flex items-center gap-1 border border-gold-500/40 active:scale-95 flex-shrink-0">
              <i class="fa-solid fa-plus text-[10px]"></i>
              <span>Buy</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }).join('');
}

// ==============================================================================
// 2. ARTISAN PROVENANCE PASSPORT MODAL
// ==============================================================================
function openProvenanceModal(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  state.currentModalProduct = product;

  document.getElementById('prov-title').textContent = product.title;
  document.getElementById('prov-artisan-name').textContent = product.artisan?.name || 'Master Artisan';
  document.getElementById('prov-artisan-lineage').textContent = `${product.artisan?.generation || 'Generational Artisan'} • ${product.artisan?.experienceYears || 25} Years Mastery`;
  document.getElementById('prov-village').innerHTML = `<i class="fa-solid fa-location-dot text-red-400 mr-1"></i> ${product.artisan?.village || 'Gorakhpur, UP'}`;
  document.getElementById('prov-coords').textContent = product.artisan?.coordinates || '26.7606° N, 83.3732° E';
  document.getElementById('prov-artisan-img').src = product.artisan?.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80';
  document.getElementById('prov-audio-quote').textContent = `"${product.artisan?.audioBlessing || 'Ram Ram bhaiya. Yeh saman hamne poori mehnat aur shuddhata se banaya hai.'}"`;
  
  document.getElementById('prov-cert-id').textContent = product.provenance?.certificateId || 'KG-IND-2026-0941';
  document.getElementById('prov-material').textContent = product.provenance?.material || 'Natural Organic Earth';
  document.getElementById('prov-firing').textContent = product.provenance?.firingMethod || 'Hand-turned traditional slow kiln';
  document.getElementById('prov-market-price').textContent = `₹${product.marketPrice || Math.round(product.price * 1.8)}`;
  document.getElementById('prov-price').textContent = `₹${product.price}`;

  document.getElementById('modal-provenance').classList.remove('hidden');
}

function closeProvenanceModal() {
  document.getElementById('modal-provenance').classList.add('hidden');
  stopSpeechAudio();
}

function toggleArtisanAudioBlessing() {
  if (!state.currentModalProduct) return;
  const quote = state.currentModalProduct.artisan?.audioBlessing || "Ram Ram bhaiya. Yeh saman hamne poori mehnat se banaya hai.";
  speakText(quote, 'hi-IN');
}

function speakText(text, lang = 'hi-IN') {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }
}

function stopSpeechAudio() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function addCurrentModalToCart() {
  if (state.currentModalProduct) {
    addToCart(state.currentModalProduct.id);
    closeProvenanceModal();
  }
}

// ==============================================================================
// 3. CART & DIRECT CHECKOUT
// ==============================================================================
function addToCart(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existing = state.cart.find(item => item.product.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ product, quantity: 1 });
  }

  updateCartCounter();
  showToast(`Added "${product.title}" to cart!`, 'success');
}

function updateCartCounter() {
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const headerCounter = document.getElementById('cart-counter');
  if (headerCounter) headerCounter.textContent = totalItems;
  const bottomCounter = document.getElementById('bottom-cart-counter');
  if (bottomCounter) bottomCounter.textContent = totalItems;
}

function initUserAuthAndAddress() {
  const user = JSON.parse(localStorage.getItem('kaarigar_user') || 'null');
  const address = JSON.parse(localStorage.getItem('kaarigar_address') || 'null');
  state.user = user;
  state.address = address;

  const headerName = document.getElementById('header-user-name');
  const bottomUserLabel = document.getElementById('bottom-nav-user-label');
  if (user && user.loggedIn) {
    const firstName = (user.name || 'User').split(' ')[0];
    if (headerName) {
      headerName.textContent = `Hi, ${firstName}`;
    }
    if (bottomUserLabel) {
      bottomUserLabel.textContent = firstName;
    }
  } else {
    if (headerName) headerName.textContent = 'Login';
    if (bottomUserLabel) bottomUserLabel.textContent = 'खाता';
  }
}

function populateCheckoutAddress() {
  const user = JSON.parse(localStorage.getItem('kaarigar_user') || 'null');
  const address = JSON.parse(localStorage.getItem('kaarigar_address') || 'null');
  state.user = user;
  state.address = address;

  const savedView = document.getElementById('chk-saved-address-view');
  const manualView = document.getElementById('chk-manual-address-view');
  const actionLabel = document.getElementById('chk-addr-action');

  if (address && (address.fullAddress || address.house)) {
    if (savedView) savedView.classList.remove('hidden');
    if (manualView) manualView.classList.add('hidden');
    if (actionLabel) actionLabel.textContent = 'Change';

    const displayName = document.getElementById('chk-display-name');
    const displayPhone = document.getElementById('chk-display-phone');
    const displayAddr = document.getElementById('chk-display-address');

    if (displayName) displayName.textContent = address.name || user?.name || 'Valued Customer';
    if (displayPhone) displayPhone.textContent = `+91 ${address.phone || user?.phone || '9876543210'}`;
    if (displayAddr) displayAddr.textContent = address.fullAddress || `${address.house}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode}`;

    const chkName = document.getElementById('chk-name');
    const chkPhone = document.getElementById('chk-phone');
    const chkAddress = document.getElementById('chk-address');
    if (chkName) chkName.value = address.name || user?.name || '';
    if (chkPhone) chkPhone.value = address.phone || user?.phone || '';
    if (chkAddress) chkAddress.value = address.fullAddress || `${address.house}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode}`;
  } else if (user && user.loggedIn) {
    if (savedView) savedView.classList.add('hidden');
    if (manualView) manualView.classList.remove('hidden');
    if (actionLabel) actionLabel.textContent = 'Save Address';

    const chkName = document.getElementById('chk-name');
    const chkPhone = document.getElementById('chk-phone');
    if (chkName) chkName.value = user.name || '';
    if (chkPhone) chkPhone.value = user.phone || '';
  } else {
    if (savedView) savedView.classList.add('hidden');
    if (manualView) manualView.classList.remove('hidden');
    if (actionLabel) actionLabel.textContent = 'Login to Autofill';
  }
}

function openCartModal() {
  populateCheckoutAddress();
  renderCart();
  document.getElementById('modal-cart').classList.remove('hidden');
}

function closeCartModal() {
  document.getElementById('modal-cart').classList.add('hidden');
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400 space-y-2">
        <i class="fa-solid fa-basket-shopping text-2xl text-slate-500"></i>
        <p class="text-xs">Your cart is empty.</p>
      </div>
    `;
    updateCartTotals(0, 0);
    return;
  }

  let subtotal = 0;
  let artisanTotal = 0;

  container.innerHTML = state.cart.map((item, index) => {
    const itemTotal = item.product.price * item.quantity;
    const itemArtisan = item.product.artisanPayout * item.quantity;
    subtotal += itemTotal;
    artisanTotal += itemArtisan;

    return `
      <div class="flex items-center justify-between p-3 rounded-xl bg-obsidian border border-borderDark gap-3">
        <img src="${item.product.images?.studio || item.product.images?.raw}" class="w-12 h-12 rounded-lg object-cover">
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-bold text-white truncate">${item.product.title}</h4>
          <span class="text-[11px] text-gold-400">₹${item.product.price} × ${item.quantity}</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="changeCartQty(${index}, -1)" class="w-6 h-6 rounded bg-card hover:bg-surface text-xs">-</button>
          <span class="text-xs font-bold">${item.quantity}</span>
          <button onclick="changeCartQty(${index}, 1)" class="w-6 h-6 rounded bg-card hover:bg-surface text-xs">+</button>
        </div>
      </div>
    `;
  }).join('');

  updateCartTotals(subtotal, artisanTotal);
}

function changeCartQty(index, change) {
  state.cart[index].quantity += change;
  if (state.cart[index].quantity <= 0) {
    state.cart.splice(index, 1);
  }
  updateCartCounter();
  renderCart();
}

function updateCartTotals(subtotal, artisanTotal) {
  document.getElementById('cart-subtotal').textContent = `₹${subtotal.toLocaleString()}`;
  const artisanTotalEl = document.getElementById('cart-artisan-total');
  if (artisanTotalEl) artisanTotalEl.textContent = `₹${artisanTotal.toLocaleString()} (Direct to Maker)`;
  document.getElementById('cart-grand-total').textContent = `₹${subtotal.toLocaleString()}`;

  // Update UPI display amount
  const upiDisplayEl = document.getElementById('upi-display-amount');
  if (upiDisplayEl) upiDisplayEl.textContent = `₹${subtotal.toLocaleString()}`;

  // Standard UPI deep link string with official UPI ID
  const upiString = `upi://pay?pa=${state.merchantUpiId}&pn=KAARIGAR%20AI&am=${subtotal}&cu=INR&tn=Artisan%20Direct%20Purchase`;
  state.currentUpiString = upiString;

  // Dynamic QR Code for laptop/desktop
  const upiQrImg = document.getElementById('upi-qr-image');
  if (upiQrImg) {
    upiQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiString)}&margin=4`;
  }

  // Mobile App redirect link
  const btnUpiMobile = document.getElementById('btn-upi-mobile-redirect');
  if (btnUpiMobile) {
    btnUpiMobile.href = upiString;
    btnUpiMobile.onclick = function(e) {
      // Direct redirect on mobile device to trigger UPI chooser dialog
      window.location.href = upiString;
    };
  }

  // Auto-detect mode if not toggled by user
  if (!state.upiMode) {
    state.upiMode = isMobileDevice() ? 'phone' : 'laptop';
  }
  renderUpiDeviceView();

  // Update PayPal USD amount
  const rate = state.paypalConfig?.inrToUsdRate || 0.012;
  const usd = (subtotal * rate).toFixed(2);
  const usdEl = document.getElementById('paypal-usd-amount');
  if (usdEl) {
    usdEl.textContent = `$${usd} USD`;
  }
}

function renderUpiDeviceView() {
  const phoneView = document.getElementById('upi-phone-view');
  const laptopView = document.getElementById('upi-laptop-view');
  const toggleBtn = document.getElementById('btn-toggle-upi-mode');

  if (state.upiMode === 'phone') {
    if (phoneView) phoneView.classList.remove('hidden');
    if (laptopView) laptopView.classList.add('hidden');
    if (toggleBtn) toggleBtn.textContent = 'Show QR Code for Laptop / Desktop';
  } else {
    if (phoneView) phoneView.classList.add('hidden');
    if (laptopView) laptopView.classList.remove('hidden');
    if (toggleBtn) toggleBtn.textContent = 'Switch to UPI Mobile App Link';
  }
}

function toggleUpiDeviceMode() {
  state.upiMode = state.upiMode === 'phone' ? 'laptop' : 'phone';
  renderUpiDeviceView();
}

function copyUpiId() {
  navigator.clipboard.writeText(state.merchantUpiId);
  showToast(`UPI ID (${state.merchantUpiId}) copied!`, 'success');
}

async function handleUpiPhonePay() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }

  showToast('Connecting to your UPI App (GPay / PhonePe / Paytm)...', 'info');

  const subtotal = state.cart.reduce((s, i) => s + (i.product.price * i.quantity), 0);
  const upiString = state.currentUpiString || `upi://pay?pa=${state.merchantUpiId}&pn=KAARIGAR%20AI&am=${subtotal}&cu=INR&tn=Artisan%20Direct%20Purchase`;

  // Submit order in background
  const result = await submitCartOrder(`UPI (${state.merchantUpiId})`);
  if (!result || !result.success) return;

  // Launch UPI app chooser on phone
  window.location.href = upiString;

  // Redirect to Order Confirmed page
  setTimeout(() => {
    window.location.href = `/order-confirmed?orderId=${result.orderId}`;
  }, 1000);
}

// Meesho-style Payment Method Selector
function selectPaymentMethod(method) {
  const hiddenInput = document.getElementById('chk-payment');
  if (hiddenInput) {
    if (method === 'UPI') hiddenInput.value = `UPI (${state.merchantUpiId})`;
    else if (method === 'Card') hiddenInput.value = `Card (Settled to ${state.merchantUpiId})`;
    else if (method === 'COD') hiddenInput.value = 'Cash on Delivery (COD)';
    else if (method === 'PayPal') hiddenInput.value = 'PayPal (Global)';
    else hiddenInput.value = method;
  }

  // Update button visual states
  document.querySelectorAll('.pay-method-btn').forEach(btn => {
    btn.classList.remove('active', 'border-emerald-500', 'bg-emerald-500/15', 'text-emerald-300', 'border-gold-500', 'bg-gold-500/15', 'text-gold-300', 'border-[#0079C1]', 'bg-[#0079C1]/20', 'text-white');
    btn.classList.add('border-borderDark', 'bg-card', 'text-slate-300');
  });

  const activeBtn = document.getElementById(`pay-method-${method}`);
  if (activeBtn) {
    activeBtn.classList.remove('border-borderDark', 'bg-card', 'text-slate-300');
    if (method === 'PayPal') {
      activeBtn.classList.add('active', 'border-[#0079C1]', 'bg-[#0079C1]/20', 'text-white');
    } else if (method === 'UPI') {
      activeBtn.classList.add('active', 'border-emerald-500', 'bg-emerald-500/15', 'text-emerald-300');
    } else {
      activeBtn.classList.add('active', 'border-gold-500', 'bg-gold-500/15', 'text-gold-300');
    }
  }

  const upiSection = document.getElementById('upi-payment-section');
  const cardSection = document.getElementById('card-payment-section');
  const codSection = document.getElementById('cod-payment-section');
  const paypalSection = document.getElementById('paypal-payment-section');

  if (upiSection) upiSection.classList.toggle('hidden', method !== 'UPI');
  if (cardSection) cardSection.classList.toggle('hidden', method !== 'Card');
  if (codSection) codSection.classList.toggle('hidden', method !== 'COD');
  if (paypalSection) paypalSection.classList.toggle('hidden', method !== 'PayPal');

  if (method === 'PayPal') {
    initPayPalSmartButtons();
  }
}

// Fetch PayPal config from backend
async function fetchPayPalConfig() {
  try {
    const res = await fetch('/api/paypal/config');
    const data = await res.json();
    if (data.success) {
      state.paypalConfig = data;
      const rateEl = document.getElementById('paypal-conversion-rate');
      if (rateEl) {
        rateEl.textContent = `₹1 ≈ $${data.inrToUsdRate} ${data.currency}`;
      }
    }
  } catch (err) {
    console.warn('Could not fetch PayPal config:', err);
  }
}

// Render or prepare PayPal Smart Buttons
async function initPayPalSmartButtons() {
  const container = document.getElementById('paypal-button-container');
  if (!container) return;

  // If already rendered, do not duplicate
  if (state.paypalButtonsRendered) return;

  if (window.paypal && window.paypal.Buttons) {
    try {
      container.innerHTML = '';
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 42
        },
        createOrder: async () => {
          if (state.cart.length === 0) {
            showToast('Cart is empty', 'error');
            throw new Error('Cart empty');
          }
          const name = document.getElementById('chk-name').value.trim() || 'Global Patron';
          const subtotal = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          
          const res = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amountInr: subtotal,
              customerName: name,
              items: state.cart
            })
          });
          const data = await res.json();
          return data.orderId;
        },
        onApprove: async (data, actions) => {
          await completePayPalOrder(data.orderID || 'PP-DIRECT', 'buyer@paypal.com', 'PayPal Verified Patron');
        },
        onError: (err) => {
          console.warn('PayPal button execution event:', err);
          showToast('PayPal info: You can also use the One-Click Instant Sandbox button below.', 'info');
        }
      }).render('#paypal-button-container');
      state.paypalButtonsRendered = true;
    } catch (err) {
      console.warn('Failed rendering PayPal SDK buttons, fallback available:', err);
    }
  }
}

// Reusable order creation helper with persistence and redirection
async function submitCartOrder(paymentMethod) {
  if (state.cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return { success: false };
  }

  const savedAddress = state.address || JSON.parse(localStorage.getItem('kaarigar_address') || 'null');
  const savedUser = state.user || JSON.parse(localStorage.getItem('kaarigar_user') || 'null');

  let name = '';
  let phone = '';
  let address = '';

  if (savedAddress && (savedAddress.fullAddress || savedAddress.house)) {
    name = savedAddress.name || savedUser?.name || 'Valued Customer';
    phone = savedAddress.phone || savedUser?.phone || '9876543210';
    address = savedAddress.fullAddress || `${savedAddress.house}, ${savedAddress.street}, ${savedAddress.city}, ${savedAddress.state} - ${savedAddress.pincode}`;
  } else {
    name = document.getElementById('chk-name')?.value?.trim() || savedUser?.name || 'Valued Customer';
    phone = document.getElementById('chk-phone')?.value?.trim() || savedUser?.phone || '9876543210';
    address = document.getElementById('chk-address')?.value?.trim() || 'Direct Express Delivery';
  }

  if (!address || address.length < 5) {
    showToast('Please provide a complete delivery address', 'error');
    return { success: false };
  }

  const totalAmount = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const artisanShare = state.cart.reduce((sum, item) => sum + (item.product.artisanPayout * item.quantity), 0);
  const itemsList = state.cart.map(item => ({
    title: item.product.title,
    quantity: item.quantity,
    price: item.product.price * item.quantity
  }));

  try {
    let lastOrder = null;
    let lastDispatch = null;

    for (const item of state.cart) {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.product.id,
          productTitle: item.product.title,
          quantity: item.quantity,
          customerName: name,
          customerPhone: phone,
          deliveryAddress: address,
          paymentMethod: paymentMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        lastOrder = data.data;
        lastDispatch = data.whatsappDispatch;
      }
    }

    const orderId = lastOrder?.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Store confirmed order details in localStorage for the Order Confirmed page
    localStorage.setItem('kaarigar_last_order', JSON.stringify({
      id: orderId,
      customerName: name,
      customerPhone: phone,
      deliveryAddress: address,
      total: totalAmount,
      artisanShare: artisanShare,
      paymentMethod: paymentMethod,
      itemsList: itemsList,
      whatsappDispatch: lastDispatch
    }));

    state.cart = [];
    updateCartCounter();
    closeCartModal();

    return {
      success: true,
      orderId: orderId,
      total: totalAmount,
      order: lastOrder,
      dispatch: lastDispatch
    };
  } catch (err) {
    console.error('Order submission error:', err);
    showToast('Failed to complete order: ' + err.message, 'error');
    return { success: false, error: err.message };
  }
}

// One-Click PayPal Quick-Pay for instant demo & testing
async function handlePayPalQuickPay() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty! Add an item first.', 'error');
    return;
  }

  const name = document.getElementById('chk-name')?.value?.trim() || "Global Heritage Collector";
  const address = document.getElementById('chk-address')?.value?.trim() || "Flat 101, Green Glen Layout, Bengaluru";
  const subtotal = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const rate = state.paypalConfig?.inrToUsdRate || 0.012;
  const amountUsd = Number((subtotal * rate).toFixed(2));
  const simOrderId = `PP-TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const res = await fetch('/api/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paypalOrderId: simOrderId,
        payerEmail: `${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'patron'}@paypal-artisan.org`,
        payerName: name,
        customerName: name,
        deliveryAddress: address,
        cart: state.cart,
        amountUsd: amountUsd,
        amountInr: subtotal
      })
    });

    const result = await res.json();
    if (result.success) {
      localStorage.setItem('kaarigar_last_order', JSON.stringify({
        id: simOrderId,
        customerName: name,
        customerPhone: '9876543210',
        deliveryAddress: address,
        total: subtotal,
        artisanShare: Math.round(subtotal * 0.88),
        paymentMethod: 'PayPal (USD)',
        itemsList: state.cart.map(i => ({ title: i.product.title, quantity: i.quantity, price: i.product.price * i.quantity }))
      }));
      state.cart = [];
      updateCartCounter();
      closeCartModal();
      window.location.href = `/order-confirmed?orderId=${simOrderId}`;
    } else {
      showToast(result.error || 'Failed to capture PayPal payment', 'error');
    }
  } catch (err) {
    console.error('PayPal quick pay error:', err);
    showToast('PayPal payment processing failed', 'error');
  }
}

// Complete standard PayPal capture
async function completePayPalOrder(orderId, payerEmail, payerName) {
  const name = document.getElementById('chk-name')?.value?.trim() || payerName;
  const address = document.getElementById('chk-address')?.value?.trim() || "Verified PayPal Address";
  const subtotal = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const rate = state.paypalConfig?.inrToUsdRate || 0.012;
  const amountUsd = Number((subtotal * rate).toFixed(2));

  try {
    const res = await fetch('/api/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paypalOrderId: orderId,
        payerEmail: payerEmail,
        payerName: name,
        customerName: name,
        deliveryAddress: address,
        cart: state.cart,
        amountUsd: amountUsd,
        amountInr: subtotal
      })
    });

    const result = await res.json();
    if (result.success) {
      localStorage.setItem('kaarigar_last_order', JSON.stringify({
        id: orderId,
        customerName: name,
        customerPhone: '9876543210',
        deliveryAddress: address,
        total: subtotal,
        artisanShare: Math.round(subtotal * 0.88),
        paymentMethod: 'PayPal (USD)',
        itemsList: state.cart.map(i => ({ title: i.product.title, quantity: i.quantity, price: i.product.price * i.quantity }))
      }));
      state.cart = [];
      updateCartCounter();
      closeCartModal();
      window.location.href = `/order-confirmed?orderId=${orderId}`;
    }
  } catch (err) {
    console.error('Error completing PayPal order:', err);
    showToast('Failed to record PayPal order', 'error');
  }
}

async function handleCheckoutSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (state.cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }

  const payment = document.getElementById('chk-payment')?.value || `UPI (${state.merchantUpiId})`;
  const orderResult = await submitCartOrder(payment);

  if (orderResult && orderResult.success) {
    window.location.href = `/order-confirmed?orderId=${orderResult.orderId}`;
  }
}

// ==============================================================================
// 3.5 ORDER SUCCESS & DUAL WHATSAPP MODAL
// ==============================================================================
function showOrderSuccessModal(orderData, dispatch, totalAmount, artisanShare, paymentMethod) {
  const modal = document.getElementById('modal-order-success');
  if (!modal) return;

  document.getElementById('success-order-id').textContent = orderData.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  document.getElementById('success-order-total').textContent = `₹${(totalAmount || orderData.amount || 0).toLocaleString()}`;
  document.getElementById('success-artisan-payout').textContent = `₹${(artisanShare || orderData.artisanShare || Math.round((totalAmount || 0) * 0.88)).toLocaleString()}`;
  document.getElementById('success-payment-method').textContent = paymentMethod || orderData.paymentMethod || `UPI (${state.merchantUpiId})`;

  if (dispatch) {
    // 1. Delivery Partner Box
    if (dispatch.deliveryPartner) {
      const deliveryBox = document.getElementById('preview-wa-delivery');
      if (deliveryBox) deliveryBox.textContent = dispatch.deliveryPartner.message;
      const btnDelivery = document.getElementById('btn-wa-delivery');
      if (btnDelivery) btnDelivery.href = dispatch.deliveryPartner.whatsappUrl;
    }

    // 2. Company HQ Box
    if (dispatch.company) {
      const companyBox = document.getElementById('preview-wa-company');
      if (companyBox) companyBox.textContent = dispatch.company.message;
      const btnCompany = document.getElementById('btn-wa-company');
      if (btnCompany) btnCompany.href = dispatch.company.whatsappUrl;
    }
  }

  modal.classList.remove('hidden');
}

function closeOrderSuccessModal() {
  const modal = document.getElementById('modal-order-success');
  if (modal) modal.classList.add('hidden');
}

// ==============================================================================
// 4. PHONE QR CODE & SERVER MODAL
// ==============================================================================
async function fetchServerInfo() {
  try {
    const res = await fetch('/api/server/network-info');
    const result = await res.json();
    if (result.success) {
      state.serverInfo = result;
      const qrImg = document.getElementById('server-qr-code');
      if (qrImg && result.server.sellerQrCodeDataUrl) {
        qrImg.src = result.server.sellerQrCodeDataUrl;
      } else if (qrImg && result.server.qrCodeDataUrl) {
        qrImg.src = result.server.qrCodeDataUrl;
      }
      const sellerLink = result.server.sellerUrl || `${result.server.networkUrl}/artisan`;
      document.getElementById('qr-server-ip').textContent = sellerLink;
      document.getElementById('db-health-badge').textContent = result.database.storageMode;
    }
  } catch (err) {
    console.error('Failed to fetch server info:', err);
  }
}

function openServerModal() {
  fetchServerInfo();
  document.getElementById('modal-server').classList.remove('hidden');
}

function closeServerModal() {
  document.getElementById('modal-server').classList.add('hidden');
}

function copyServerUrl() {
  const sellerLink = state.serverInfo?.server?.sellerUrl || `${state.serverInfo?.server?.networkUrl}/artisan`;
  if (sellerLink) {
    navigator.clipboard.writeText(sellerLink);
    showToast('विक्रेता मोबाइल लिंक (Seller URL) कॉपी किया गया!', 'success');
  }
}

// Toast
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-box');
  if (!container) return;

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200',
    error: 'bg-red-900/90 border-red-500/50 text-red-200',
    info: 'bg-card border-gold-500/50 text-gold-300'
  };

  toast.className = `p-4 rounded-xl border text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-3 transition-all duration-300 ${colors[type] || colors.info}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-emerald-400' : type === 'error' ? 'fa-circle-exclamation text-red-400' : 'fa-circle-info text-gold-400'} text-base"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}
