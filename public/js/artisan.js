/**
 * KAARIGAR AI — DEDICATED ARTISAN CONTROLLER (artisan.js)
 * Virtual Business Manager in Every Artisan's Pocket
 */

const state = {
  currentLangTab: 'en',
  isSHGMode: false,
  isRecording: false,
  recognition: null,
  extractedArtisanData: null,
  activeSamplePhoto: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'
};

document.addEventListener('DOMContentLoaded', () => {
  initSpeechRecognition();
  loadFestivalForecast();
  loadArtisanOrders();
});

// ==============================================================================
// 1. ENGINE A: AI IMAGE STUDIO (CAMERA & BEFORE/AFTER)
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
// 2. ENGINE B: MULTILINGUAL AUTO-CATALOGER (SPEECH-TO-TEXT)
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
      showToast('माइक आवाज़ नहीं पकड़ पाया, कृपया दोबारा बोलें या टेस्ट बटन दबाएं', 'info');
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
      setTimeout(() => {
        window.open('/', '_blank');
      }, 1500);
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

// 6. Interactive Seller WhatsApp Bot
function openWhatsAppModal() {
  document.getElementById('modal-whatsapp').classList.remove('hidden');
}

function closeWhatsAppModal() {
  document.getElementById('modal-whatsapp').classList.add('hidden');
}

function sendQuickPrompt(text) {
  const input = document.getElementById('wa-input-text');
  if (input) {
    input.value = text;
    handleSendWhatsAppBot(new Event('submit'));
  }
}

function recordWhatsAppVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Voice typing supported on Chrome & mobile browsers', 'info');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'hi-IN';
  const micBtn = document.getElementById('wa-mic-btn');

  if (micBtn) {
    micBtn.classList.add('bg-red-600', 'text-white', 'animate-pulse');
  }
  showToast('बोलिए... (Listening Hindi voice)', 'info');

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    const input = document.getElementById('wa-input-text');
    if (input) {
      input.value = transcript;
      handleSendWhatsAppBot(new Event('submit'));
    }
  };

  recognition.onend = () => {
    if (micBtn) {
      micBtn.classList.remove('bg-red-600', 'text-white', 'animate-pulse');
    }
  };

  recognition.start();
}

async function handleSendWhatsAppBot(e) {
  if (e && e.preventDefault) e.preventDefault();

  const input = document.getElementById('wa-input-text');
  if (!input) return;
  const message = input.value.trim();
  if (!message) return;

  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const container = document.getElementById('wa-chat-container');

  // 1. Append User Outgoing Message
  const outgoingDiv = document.createElement('div');
  outgoingDiv.className = 'wa-bubble-outgoing p-3 space-y-1 max-w-[85%] rounded-2xl bg-[#005C4B] text-white ml-auto shadow';
  outgoingDiv.innerHTML = `
    <p class="text-[11px] leading-relaxed">${message}</p>
    <span class="text-[9px] text-emerald-200 block text-right font-mono">${now} ✓✓</span>
  `;
  container.appendChild(outgoingDiv);
  input.value = '';
  container.scrollTop = container.scrollHeight;

  // 2. Typing Indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'wa-bubble-incoming p-2.5 max-w-[70%] rounded-2xl bg-[#202C33] text-emerald-400 text-[10px] animate-pulse';
  typingDiv.id = 'wa-typing-bubble';
  typingDiv.textContent = 'Kaarigar AI लिख रहा है...';
  container.appendChild(typingDiv);
  container.scrollTop = container.scrollHeight;

  try {
    const res = await fetch('/api/whatsapp/seller-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const result = await res.json();
    typingDiv.remove();

    if (result.success && result.data) {
      const botData = result.data;
      const incomingDiv = document.createElement('div');
      incomingDiv.className = 'wa-bubble-incoming p-3 space-y-2 max-w-[90%] rounded-2xl bg-[#202C33] text-slate-200 shadow';
      
      let actionBtn = '';
      if (botData.craftExtracted) {
        actionBtn = `
          <div class="pt-1.5 border-t border-white/5">
            <button onclick="publishFromWhatsApp('${botData.craftExtracted}', ${botData.suggestedPrice || 280})" class="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>लाइव स्टोर पर 24/7 प्रकाशित करें</span>
            </button>
          </div>
        `;
      }

      incomingDiv.innerHTML = `
        <div class="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
          <i class="fa-solid fa-robot"></i>
          <span>${botData.sender || 'Kaarigar AI'}</span>
        </div>
        <div class="text-[11px] leading-relaxed whitespace-pre-wrap">${botData.reply}</div>
        ${actionBtn}
        <span class="text-[9px] text-slate-400 block text-right font-mono">${now}</span>
      `;
      container.appendChild(incomingDiv);
      container.scrollTop = container.scrollHeight;
    }
  } catch (err) {
    typingDiv.remove();
    console.error('WhatsApp Bot error:', err);
    showToast('Bot response failed', 'error');
  }
}

async function publishFromWhatsApp(craftName, price) {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: craftName,
        category: "Terracotta",
        price: price,
        artisanPayout: Math.round(price * 0.88),
        materials: "100% प्राकृतिक मिट्टी व रंग",
        description: `${craftName} — प्रामाणिक भारतीय ग्रामीण हस्तशिल्प। Kaarigar WhatsApp वर्चुअल असिस्टेंट द्वारा स्वचालित सूचीबद्ध।`,
        images: {
          raw: state.activeSamplePhoto,
          studio: state.activeSamplePhoto
        },
        artisan: {
          name: "Rameshwar Kumhar",
          village: "Mithila Craft Cluster, Madhubani",
          state: "Bihar",
          contactPhone: "+91 78150 28355"
        }
      })
    });
    const data = await res.json();
    if (data.success) {
      closeWhatsAppModal();
      showToast('🎉 WhatsApp से सामान सीधे Kaarigar Store पर 24/7 लाइव हो गया!', 'success');
      loadArtisanOrders();
    }
  } catch (err) {
    console.error('Publish error:', err);
    showToast('Failed to publish product', 'error');
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

// 7. Load Dynamic Orders & PayPal Payouts
async function loadArtisanOrders() {
  try {
    const res = await fetch('/api/orders');
    const data = await res.json();
    if (data.success) {
      const orders = data.data || [];
      const totalPayout = orders.reduce((sum, o) => sum + (o.artisanShare || Math.round((o.amount || 0) * 0.88)), 0);
      
      const earningsEl = document.getElementById('dash-total-earnings');
      if (earningsEl) earningsEl.textContent = `₹${totalPayout.toLocaleString()} कुल कमाई`;

      const ordersCountEl = document.getElementById('dash-orders-count');
      if (ordersCountEl) ordersCountEl.textContent = `${orders.length} ऑर्डर`;

      const container = document.getElementById('artisan-orders-container');
      if (container) {
        if (orders.length === 0) {
          container.innerHTML = '<div class="text-[11px] text-slate-400 text-center py-1">कोई नया ऑर्डर नहीं</div>';
          return;
        }

        container.innerHTML = orders.slice(0, 4).map(o => {
          const isPayPal = o.paymentMethod && o.paymentMethod.includes('PayPal');
          return `
            <div class="flex items-center justify-between p-2 rounded-xl bg-surface border ${isPayPal ? 'border-[#0079C1]/50 bg-[#001C64]/20' : 'border-borderDark'}">
              <div class="space-y-0.5 min-w-0 pr-2">
                <div class="flex items-center gap-1.5">
                  ${isPayPal ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-[#0079C1]/30 text-[#0079C1] font-bold border border-[#0079C1]/50 font-mono"><i class="fa-brands fa-paypal"></i> PayPal</span>' : '<span class="text-[9px] px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-300 font-bold border border-gold-500/30">UPI</span>'}
                  <span class="text-xs font-bold text-white truncate">${o.productTitle}</span>
                </div>
                <div class="text-[10px] text-slate-400 truncate">ग्राहक: ${o.customerName}</div>
              </div>
              <div class="text-right flex-shrink-0">
                <span class="text-xs font-bold text-emerald-400 block">+₹${o.artisanShare || Math.round(o.amount * 0.88)}</span>
                <span class="text-[9px] text-slate-400">${isPayPal ? 'अंतरराष्ट्रीय' : 'जमा'}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.warn('Could not load orders:', err);
  }
}
