/**
 * KAARIGAR AI FRONTEND CONTROLLER
 * A Virtual Business Manager for India's Artisans & Weavers
 */

const state = {
  activeSection: 'landing', // 'landing' | 'artisan' | 'buyer'
  currentLangTab: 'en', // 'en' | 'hi'
  isSHGMode: false,
  products: [],
  cart: [],
  currentModalProduct: null,
  isRecording: false,
  recognition: null,
  extractedArtisanData: null,
  activeSamplePhoto: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  serverInfo: null
};

// ==============================================================================
// 1. INITIALIZATION & NAVIGATION
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initSpeechRecognition();
  fetchProducts();
  fetchServerInfo();
  loadFestivalForecast();
});

function switchSection(sectionName) {
  state.activeSection = sectionName;
  const sections = ['landing', 'artisan', 'buyer'];

  sections.forEach(s => {
    const el = document.getElementById(`section-${s}`);
    const tab = document.getElementById(`nav-${s}`);
    if (s === sectionName) {
      el.classList.remove('hidden');
      tab.classList.add('active', 'text-white', 'bg-card', 'border', 'border-gold-500/40', 'shadow-sm');
      tab.classList.remove('text-slate-400');
    } else {
      el.classList.add('hidden');
      tab.classList.remove('active', 'text-white', 'bg-card', 'border', 'border-gold-500/40', 'shadow-sm');
      tab.classList.add('text-slate-400');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Landing Page Studio Preview Toggle
function toggleLandingStudioPreview(isStudio) {
  const overlay = document.getElementById('lp-studio-overlay');
  if (isStudio) {
    overlay.classList.remove('opacity-0');
    overlay.classList.add('opacity-100');
  } else {
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0');
  }
}

// ==============================================================================
// 2. ENGINE A: AI IMAGE STUDIO & PHOTO SELECTION
// ==============================================================================
function triggerFileInput() {
  document.getElementById('artisan-file-input').click();
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      state.activeSamplePhoto = event.target.result;
      document.getElementById('artisan-preview-image').src = event.target.result;
      showToast('फोटो लोड हो गई (Photo Uploaded)', 'success');
    };
    reader.readAsDataURL(file);
  }
}

function selectSampleImage(type) {
  const samples = {
    terracotta: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    painting: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    silk: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
    wood: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
    dokra: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
  };
  state.activeSamplePhoto = samples[type] || samples.terracotta;
  document.getElementById('artisan-preview-image').src = state.activeSamplePhoto;
}

function toggleStudioLighting(checked) {
  const overlay = document.getElementById('artisan-studio-overlay');
  if (checked) {
    overlay.classList.remove('opacity-0');
    overlay.classList.add('opacity-100');
  } else {
    overlay.classList.add('opacity-0');
    overlay.classList.remove('opacity-100');
  }
}

// ==============================================================================
// 3. ENGINE B: MULTILINGUAL AUTO-CATALOGER (SPEECH-TO-TEXT)
// ==============================================================================
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = false;
    state.recognition.interimResults = false;
    state.recognition.lang = 'hi-IN';

    state.recognition.onstart = () => {
      state.isRecording = true;
      updateMicUI(true);
    };

    state.recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById('mic-status-text').textContent = `सुना गया: "${transcript}"`;
      await processSpokenText(transcript);
    };

    state.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      state.isRecording = false;
      updateMicUI(false);
      showToast('माइक आवाज़ नहीं पकड़ पाया, कृपया दोबारा बोलें या डेमो बटन दबाएं', 'info');
    };

    state.recognition.onend = () => {
      state.isRecording = false;
      updateMicUI(false);
    };
  }
}

function toggleSpeechRecording() {
  if (!state.recognition) {
    simulateArtisanVoice('Yeh mitti ka ghada hai do din mein banaya 200 rupaye');
    return;
  }

  if (state.isRecording) {
    state.recognition.stop();
  } else {
    try {
      state.recognition.start();
    } catch (err) {
      console.warn('Recognition start error:', err);
    }
  }
}

function updateMicUI(isRecording) {
  const btn = document.getElementById('btn-artisan-mic');
  const label = document.getElementById('mic-label');
  const status = document.getElementById('mic-status-text');

  if (isRecording) {
    btn.classList.add('mic-recording');
    label.textContent = 'सुन रहे हैं...';
    status.textContent = '🔴 बोलिए: क्या बनाया है, कितने दिन लगे, कितना दाम चाहिए...';
  } else {
    btn.classList.remove('mic-recording');
    label.textContent = 'बोलें';
    if (!state.extractedArtisanData) {
      status.textContent = 'बटन दबाएं और बोलना शुरू करें (या नीचे दिए गए आसान टेस्ट विकल्पों पर क्लिक करें)';
    }
  }
}

async function simulateArtisanVoice(spokenText) {
  document.getElementById('mic-status-text').textContent = `डेमो सुना गया: "${spokenText}"`;
  await processSpokenText(spokenText);
}

async function processSpokenText(spokenText) {
  try {
    showToast('AI समझ रहा है और द्विभाषी विवरण बना रहा है...', 'info');
    const res = await fetch('/api/ai/process-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spokenText })
    });
    const result = await res.json();
    if (result.success) {
      state.extractedArtisanData = result.data;
      displayExtractedAI(result.data);
      playVoiceConfirmation();
    }
  } catch (err) {
    console.error('AI Voice processing failed:', err);
    showToast('प्रोसेसिंग में समस्या आई', 'error');
  }
}

function displayExtractedAI(data) {
  document.getElementById('ai-result-card').classList.remove('hidden');
  
  // English View
  document.getElementById('extracted-title-en').textContent = data.title;
  document.getElementById('extracted-subtitle-en').textContent = data.subtitle;
  document.getElementById('extracted-story-en').textContent = data.story;

  // Hindi View
  document.getElementById('extracted-title-hi').textContent = data.titleHi;
  document.getElementById('extracted-subtitle-hi').textContent = data.subtitleHi;
  document.getElementById('extracted-story-hi').textContent = data.storyHi;

  // Pricing Range Engine C
  const p = data.pricing || {};
  document.getElementById('extracted-price-range').textContent = `₹${p.minPrice || 240} – ₹${p.maxPrice || 340}`;
  document.getElementById('extracted-recommended-price').textContent = `₹${p.recommendedPrice || 280}`;
  document.getElementById('extracted-base-price').textContent = `₹${p.baseRequestedPrice || 200}`;
  document.getElementById('extracted-artisan-payout').textContent = `₹${p.artisanPayout || 200} (${p.artisanPayoutPercent || '100%'})`;
  document.getElementById('extracted-confidence').textContent = `${p.confidence || '94%'} Confidence`;
  document.getElementById('extracted-justification').textContent = `*${p.justification || 'Based on materials, days of craftsmanship, and market demand.'}`;

  // Tags
  const tagsContainer = document.getElementById('extracted-tags');
  if (tagsContainer && data.tags) {
    tagsContainer.innerHTML = data.tags.map(t => `<span class="px-2.5 py-1 rounded bg-card border border-borderDark text-slate-300">#${t}</span>`).join('');
  }

  document.getElementById('ai-result-card').scrollIntoView({ behavior: 'smooth' });
}

function switchListingLang(lang) {
  state.currentLangTab = lang;
  const enView = document.getElementById('listing-en-view');
  const hiView = document.getElementById('listing-hi-view');
  const btnEn = document.getElementById('btn-lang-en');
  const btnHi = document.getElementById('btn-lang-hi');

  if (lang === 'en') {
    enView.classList.remove('hidden');
    hiView.classList.add('hidden');
    btnEn.className = "px-2 py-0.5 rounded bg-gold-500 text-obsidian font-bold";
    btnHi.className = "px-2 py-0.5 rounded bg-card text-slate-300 hover:text-white font-hindi";
  } else {
    hiView.classList.remove('hidden');
    enView.classList.add('hidden');
    btnHi.className = "px-2 py-0.5 rounded bg-gold-500 text-obsidian font-bold font-hindi";
    btnEn.className = "px-2 py-0.5 rounded bg-card text-slate-300 hover:text-white";
  }
}

function playVoiceConfirmation() {
  if (!state.extractedArtisanData) return;
  const hindiMsg = state.extractedArtisanData.hindiConfirmation || 
    `Aapka utpaad safalta se list ho gaya hai! Daam ₹${state.extractedArtisanData.pricing?.recommendedPrice || 280} nirdharit kiya gaya hai.`;
  speakText(hindiMsg, 'hi-IN');
}

function speakHindiGuidance() {
  speakText('कारीगर AI सेवा केंद्र में आपका स्वागत है। पहले कैमरे से फोटो चुनिए, फिर माइक दबा कर बताइए कि आपने क्या बनाया है और कितना दाम चाहिए।', 'hi-IN');
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

// 1-Click Publish
async function publishArtisanProduct() {
  if (!state.extractedArtisanData) return;
  try {
    const p = state.extractedArtisanData.pricing || {};
    const payload = {
      title: state.extractedArtisanData.title,
      titleHi: state.extractedArtisanData.titleHi,
      subtitle: state.extractedArtisanData.subtitle,
      subtitleHi: state.extractedArtisanData.subtitleHi,
      category: state.extractedArtisanData.category,
      categoryHi: state.extractedArtisanData.categoryHi,
      price: p.recommendedPrice || 280,
      priceRange: {
        min: p.minPrice || 240,
        max: p.maxPrice || 340,
        recommended: p.recommendedPrice || 280,
        confidence: p.confidence || "94%",
        justification: p.justification || "Data-driven pricing recommendation"
      },
      marketPrice: p.marketComparison || 550,
      artisanPayout: p.artisanPayout || 200,
      story: state.extractedArtisanData.story,
      storyHi: state.extractedArtisanData.storyHi,
      material: state.extractedArtisanData.material,
      materialHi: state.extractedArtisanData.materialHi,
      craftTechnique: state.extractedArtisanData.craftTechnique,
      craftTechniqueHi: state.extractedArtisanData.craftTechniqueHi,
      daysToCraft: state.extractedArtisanData.daysToCraft,
      artisanName: "Village Master Maker",
      artisanNameHi: "सिद्ध ग्रामीण शिल्पकार",
      artisanVillage: "Rural Craft Cluster",
      artisanVillageHi: "शिल्पग्राम",
      artisanState: "India",
      imageUrl: state.activeSamplePhoto,
      rawSpeech: state.extractedArtisanData.rawSpeech
    };

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      showToast('बधाई हो! आपका उत्पाद Kaarigar Storefront, ONDC व GeM पर लाइव प्रकाशित हो गया है!', 'success');
      speakText('Aapka utpaad safalta se live ho gaya hai!', 'hi-IN');
      
      await fetchProducts();
      setTimeout(() => {
        switchSection('buyer');
      }, 1800);
    }
  } catch (err) {
    console.error('Publish error:', err);
    showToast('उत्पाद जोड़ने में समस्या आई', 'error');
  }
}

// Cluster & SHG Mode Toggle
function toggleSHGMode() {
  state.isSHGMode = !state.isSHGMode;
  const btn = document.getElementById('btn-toggle-shg');
  const txt = document.getElementById('shg-toggle-text');
  const dashTitle = document.getElementById('dash-title');

  if (state.isSHGMode) {
    btn.classList.add('bg-gold-500', 'text-obsidian', 'border-gold-500');
    btn.classList.remove('bg-card', 'text-slate-200');
    txt.textContent = "SHG समूह मोड (सक्रिय)";
    dashTitle.textContent = "Maa Durga Mahila SHG (14 कारीगर समूह)";
    showToast('SHG समूह मोड सक्रिय: 14 कारीगरों का सामूहिक कैटलॉग खुला', 'info');
  } else {
    btn.classList.remove('bg-gold-500', 'text-obsidian', 'border-gold-500');
    btn.classList.add('bg-card', 'text-slate-200');
    txt.textContent = "SHG समूह मोड";
    dashTitle.textContent = "आपके उत्पाद और कमाई (Dashboard)";
    showToast('व्यक्तिगत कारीगर मोड पर लौटे', 'info');
  }
}

// ==============================================================================
// 4. BUYER STOREFRONT & PROVENANCE MODAL
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

function renderProducts(products) {
  const container = document.getElementById('products-grid');
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16 bg-card rounded-3xl border border-borderDark text-slate-400 space-y-2">
        <i class="fa-solid fa-box-open text-3xl text-gold-400/50"></i>
        <p class="text-sm">No crafts found in this category.</p>
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
          
          <div class="absolute top-3 left-3 flex flex-col gap-1.5">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-obsidian/90 backdrop-blur-md text-gold-300 border border-gold-500/30">
              <i class="fa-solid fa-stamp text-gold-400"></i> ${product.giTag || 'GI Certified'}
            </span>
          </div>

          <button onclick="openProvenanceModal('${product.id}')" class="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-obsidian/85 hover:bg-gold-500 hover:text-obsidian text-slate-200 text-xs font-semibold backdrop-blur-md border border-white/10 transition flex items-center gap-1.5">
            <i class="fa-solid fa-passport"></i>
            <span>Certificate</span>
          </button>
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div class="text-[11px] font-mono uppercase tracking-wider text-gold-400/90 mb-1">
              ${product.category} • ${product.artisan?.village || 'Artisan Cluster'}
            </div>
            <h3 class="font-bold text-white font-luxury text-base group-hover:text-gold-300 transition line-clamp-1">
              ${product.title}
            </h3>
            <p class="text-xs text-slate-400 line-clamp-2 mt-1 font-light leading-relaxed">
              ${product.story || product.subtitle}
            </p>
          </div>

          <div class="flex items-center gap-2 pt-2 border-t border-borderDark/60">
            <img src="${product.artisan?.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80'}" class="w-6 h-6 rounded-full object-cover border border-gold-500/30">
            <span class="text-xs text-slate-300 font-medium">${product.artisan?.name}</span>
            <span class="text-[10px] text-emerald-400 ml-auto">₹${product.artisanPayout} direct</span>
          </div>

          <div class="pt-1 flex items-baseline justify-between">
            <div>
              <span class="text-xs text-slate-400 line-through mr-1.5">₹${product.marketPrice || Math.round(product.price * 1.8)}</span>
              <span class="text-xl font-bold text-gold-400 font-luxury">₹${product.price}</span>
            </div>
            <button onclick="addToCart('${product.id}')" class="px-3.5 py-2 rounded-xl bg-gold-500/15 hover:bg-gold-500 text-gold-300 hover:text-obsidian text-xs font-bold transition flex items-center gap-1.5 border border-gold-500/30">
              <i class="fa-solid fa-plus"></i>
              <span>Acquire</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }).join('');
}

function openProvenanceModal(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  state.currentModalProduct = product;

  document.getElementById('prov-title').textContent = product.title;
  document.getElementById('prov-artisan-name').textContent = product.artisan?.name || 'Master Artisan';
  document.getElementById('prov-artisan-lineage').textContent = `${product.artisan?.generation || 'Generational Master'} • ${product.artisan?.experienceYears || 25} Years Mastery`;
  document.getElementById('prov-village').innerHTML = `<i class="fa-solid fa-location-dot text-red-400 mr-1"></i> ${product.artisan?.village || 'Gorakhpur, UP'}`;
  document.getElementById('prov-coords').textContent = product.artisan?.coordinates || '26.7606° N, 83.3732° E';
  document.getElementById('prov-artisan-img').src = product.artisan?.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80';
  document.getElementById('prov-audio-quote').textContent = `"${product.artisan?.audioBlessing || 'Ram Ram bhaiya. Yeh saman hamne poori mehnat aur shuddhata se banaya hai.'}"`;
  
  document.getElementById('prov-cert-id').textContent = product.provenance?.certificateId || 'KG-IND-2026-0941';
  document.getElementById('prov-material').textContent = product.provenance?.material || 'Natural Earth & Fibers';
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

function addCurrentModalToCart() {
  if (state.currentModalProduct) {
    addToCart(state.currentModalProduct.id);
    closeProvenanceModal();
  }
}

// ==============================================================================
// 5. WHATSAPP FALLBACK SIMULATOR
// ==============================================================================
function openWhatsAppModal() {
  document.getElementById('modal-whatsapp').classList.remove('hidden');
}

function closeWhatsAppModal() {
  document.getElementById('modal-whatsapp').classList.add('hidden');
}

function simulateWAPublish() {
  closeWhatsAppModal();
  showToast('WhatsApp संदेश से उत्पाद Kaarigar Storefront पर तुरंत लाइव हो गया!', 'success');
  switchSection('buyer');
}

// ==============================================================================
// 6. SERVER & PHONE QR MODAL
// ==============================================================================
async function fetchServerInfo() {
  try {
    const res = await fetch('/api/server/network-info');
    const result = await res.json();
    if (result.success) {
      state.serverInfo = result;
      const qrImg = document.getElementById('server-qr-code');
      if (qrImg && result.server.qrCodeDataUrl) {
        qrImg.src = result.server.qrCodeDataUrl;
      }
      document.getElementById('qr-server-ip').textContent = result.server.networkUrl;
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
  if (state.serverInfo?.server?.networkUrl) {
    navigator.clipboard.writeText(state.serverInfo.server.networkUrl);
    showToast('Server URL copied to clipboard!', 'success');
  }
}

async function loadFestivalForecast() {
  try {
    const res = await fetch('/api/forecast');
    const result = await res.json();
    if (result.success && result.data.length > 0) {
      const fc = result.data[0];
      const el = document.getElementById('forecast-action-text');
      if (el) {
        el.textContent = `${fc.festivalNameHi} (${fc.festivalName}) में ${fc.daysRemaining} दिन शेष हैं। ${fc.actionAdviceHi} अनुशंसित बैच: ${fc.recommendedBatchPerArtisan}।`;
      }
    }
  } catch (err) {
    console.warn('Could not load forecast:', err);
  }
}

// ==============================================================================
// 7. CART & CHECKOUT
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
  document.getElementById('cart-counter').textContent = totalItems;
}

function openCartModal() {
  renderCart();
  document.getElementById('modal-cart').classList.remove('hidden');
}

function closeCartModal() {
  document.getElementById('modal-cart').classList.add('hidden');
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
  document.getElementById('cart-artisan-total').textContent = `₹${artisanTotal.toLocaleString()} (Direct to Artisan)`;
  document.getElementById('cart-grand-total').textContent = `₹${subtotal.toLocaleString()}`;
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  if (state.cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }

  const name = document.getElementById('chk-name').value;
  const address = document.getElementById('chk-address').value;
  const payment = document.getElementById('chk-payment').value;

  try {
    for (const item of state.cart) {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.product.id,
          productTitle: item.product.title,
          quantity: item.quantity,
          customerName: name,
          deliveryAddress: address,
          paymentMethod: payment
        })
      });
    }

    state.cart = [];
    updateCartCounter();
    closeCartModal();
    showToast('Order placed successfully! Funds dispatched directly to artisan.', 'success');
    fetchProducts();
  } catch (err) {
    console.error('Checkout error:', err);
    showToast('Failed to complete order', 'error');
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
