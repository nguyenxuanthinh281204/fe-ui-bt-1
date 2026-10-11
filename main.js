/**
 * AETHER LABS — E-Commerce Frontend Engine
 * Modern minimalist architecture with Web Audio synthesizer,
 * 3D Parallax, Canvas Confetti & Reactive Cart.
 */
import { Product3DViewer } from './product3d.js';

let product3D = null;

// --- Currency Rates & State ---
const CURRENCIES = {
  USD: { symbol: '$', rate: 1, format: (val) => `$${Math.round(val).toLocaleString()}` },
  VND: { symbol: '₫', rate: 25400, format: (val) => `${Math.round(val).toLocaleString('vi-VN')}₫` },
  EUR: { symbol: '€', rate: 0.92, format: (val) => `€${Math.round(val).toLocaleString()}` },
};

let currentCurrency = 'USD';
let soundEffectsEnabled = true;

// --- Product Catalog Database ---
const PRODUCTS = [
  {
    id: 'aura-max',
    name: 'Aura Max 2',
    category: 'audio',
    categoryName: 'Over-Ear Studio // ANC 2.0',
    basePrice: 549,
    image: '/assets/images/hero-black.jpg',
    imagesByColor: {
      black: '/assets/images/hero-black.jpg',
      silver: '/assets/images/hero-silver.jpg',
      midnight: '/assets/images/hero-midnight.jpg'
    },
    tag: 'FLAGSHIP',
    summary: 'Ultra-low distortion acoustic chamber carved from aerospace titanium.',
    description: 'Engineered for transcendental acoustic purity. The Aura Max 2 pairs 40mm titanium transducers with dual H3 neural processors, providing an unprecedented 48-hour continuous lossless playback session.',
    features: [
      '40mm Custom Titanium Diaphragm Drivers',
      'Dual H3 Neural Audio Processors with 48k/s tuning',
      'Adaptive Active Noise Cancellation 2.0 (99.4% suppression)',
      'AeroKnit suspension canopy for zero-pressure comfort',
      'Lossless 24-bit / 192kHz Spatial Sound with dynamic head tracking'
    ]
  },
  {
    id: 'aura-pods',
    name: 'Aura Pods Pro',
    category: 'audio',
    categoryName: 'True Wireless // Spatial Audio',
    basePrice: 279,
    image: '/assets/images/pods-pro.jpg',
    tag: 'BESTSELLER',
    summary: 'Sculpted titanium capsule with active spatial head tracking and 36h case.',
    description: 'Compact acoustic mastery. Aura Pods Pro features precision acoustic nozzles and micro-venting to equalize ear pressure during intense studio or transit use.',
    features: [
      '11mm High-Excursion Neodymium Transducer',
      'Titanium alloy magnetic charging case with Qi2 support',
      'IPX4 sweat and weather resistance',
      '6 hours listening (36 hours total with titanium case)',
      'Touch capacitive force sensor stems'
    ]
  },
  {
    id: 'aura-watch',
    name: 'Aura Kinetic Watch Ultra',
    category: 'wearables',
    categoryName: 'Biometric Wearable // Titanium 49mm',
    basePrice: 429,
    image: '/assets/images/watch-ultra.jpg',
    tag: 'EDITION',
    summary: 'Nike-inspired sports loop with sapphire crystal and ECG heart telemetry.',
    description: 'High-performance motion meets biometric precision. Engineered with a grade-5 titanium enclosure and ultra-bright 3000-nit OLED display that stays legible under blinding glare.',
    features: [
      'Grade-5 Aerospace Titanium 49mm Case',
      'Dual-frequency GPS with continuous course mapping',
      'ECG, Blood Oxygen, and Continuous Skin Temperature sensors',
      'Nike-collaborated breathable elastic sport loop band',
      '100-meter water resistance & high-altitude barometric altimeter'
    ]
  },
  {
    id: 'aura-runner',
    name: 'Kinetic Aero Runner',
    category: 'performance',
    categoryName: 'Carbon Plate // Engineered FlyKnit',
    basePrice: 220,
    image: '/assets/images/sneaker-aero.jpg',
    tag: 'KINETIC LAB',
    summary: 'Ultra-responsive curved carbon fiber plate with seamless minimalist mesh.',
    description: 'Born in the kinetic performance laboratory. Features a supercritical nitrogen-infused foam midsole paired with a spoon-shaped full-length carbon fiber propulsion plate.',
    features: [
      'Supercritical Nitrogen AetherFoam Midsole',
      'Full-length carbon fiber propulsion blade',
      'Single-thread zero-waste engineered breathable knit upper',
      'Under 185 grams (size 10.5)',
      'Micro-lugged wet traction rubber outsole'
    ]
  }
];

// --- Shopping Cart State ---
let cartState = [];
let appliedDiscount = 0; // 0.1 for 10%
const FREE_SHIPPING_THRESHOLD = 150;

// ==========================================================================
// 1. Web Audio Synthesizer (Interactive Lab & Haptic FX)
// ==========================================================================
class WebAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.osc1 = null;
    this.osc2 = null;
    this.gainNode = null;
    this.filterNode = null;
    this.noiseNode = null;
    this.noiseGain = null;
    this.currentMode = 'binaural';
    this.ancLevel = 0.85; // 0 to 1
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (!soundEffectsEnabled) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playSuccessChime() {
    if (!soundEffectsEnabled) return;
    try {
      this.init();
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
      freqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const startTime = this.ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {
      // Silently ignore
    }
  }

  startDemoAudio() {
    this.init();
    if (this.isPlaying) return;

    // Master Gain
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);

    // Filter Node (simulates ANC noise suppression)
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(3500 * (1 - this.ancLevel * 0.7), this.ctx.currentTime);

    // Oscillators for spatial tone
    this.osc1 = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();

    this.configureOscillators();

    this.osc1.connect(this.filterNode);
    this.osc2.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.osc1.start();
    this.osc2.start();

    this.isPlaying = true;
  }

  configureOscillators() {
    if (!this.osc1 || !this.osc2) return;
    const now = this.ctx.currentTime;
    if (this.currentMode === 'binaural') {
      this.osc1.type = 'sine';
      this.osc1.frequency.setValueAtTime(432, now);
      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(436, now); // 4Hz theta beat
    } else if (this.currentMode === 'harmonic') {
      this.osc1.type = 'triangle';
      this.osc1.frequency.setValueAtTime(329.63, now); // E4
      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(493.88, now); // B4 fifth
    } else if (this.currentMode === 'subbass') {
      this.osc1.type = 'sine';
      this.osc1.frequency.setValueAtTime(65.41, now); // C2 Sub-bass
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(130.81, now);
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    if (this.isPlaying) {
      this.configureOscillators();
    }
  }

  setAncLevel(val) {
    this.ancLevel = val / 100;
    if (this.filterNode && this.ctx) {
      const cutoff = 6000 * Math.max(0.1, 1 - this.ancLevel * 0.85);
      this.filterNode.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.05);
    }
  }

  stopDemoAudio() {
    if (!this.isPlaying) return;
    if (this.osc1) { this.osc1.stop(); this.osc1.disconnect(); }
    if (this.osc2) { this.osc2.stop(); this.osc2.disconnect(); }
    this.isPlaying = false;
  }
}

const audio = new WebAudioEngine();

// ==========================================================================
// 2. Waveform Canvas Visualizer
// ==========================================================================
class WaveformVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.phase = 0;
    this.animId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.render();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.width = rect.width;
    this.height = rect.height;
  }

  render() {
    const ctx = this.ctx;
    const w = this.width || 800;
    const h = this.height || 240;
    const midY = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const isPlaying = audio.isPlaying;
    const anc = audio.ancLevel; // 0 (noisy) to 1 (silenced)
    const baseAmp = isPlaying ? 35 : 8;
    const noiseFactor = (1 - anc) * (isPlaying ? 40 : 15);

    // Draw 3 layered glowing waves
    const colors = [
      'rgba(41, 151, 255, 0.85)',
      'rgba(0, 242, 254, 0.65)',
      'rgba(121, 40, 202, 0.5)'
    ];

    colors.forEach((color, layerIndex) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = layerIndex === 0 ? 2.5 : 1.5;

      for (let x = 0; x < w; x += 3) {
        const normX = x / w;
        const wave1 = Math.sin(normX * 10 + this.phase + layerIndex) * baseAmp;
        const wave2 = Math.cos(normX * 22 - this.phase * 1.5) * (noiseFactor * 0.4);
        const wave3 = Math.sin(normX * 45 + this.phase * 3) * (noiseFactor * 0.2);

        // Attenuate at edges
        const edgeWindow = Math.sin(normX * Math.PI);
        const y = midY + (wave1 + wave2 + wave3) * edgeWindow;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    this.phase += isPlaying ? 0.05 : 0.015;
    this.animId = requestAnimationFrame(() => this.render());
  }
}

// ==========================================================================
// 3. Canvas Confetti System (Triumphant Apple Pay checkout)
// ==========================================================================
class ConfettiCannon {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animating = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  fire() {
    this.resize();
    this.particles = [];
    const colors = ['#2997ff', '#00f2fe', '#ffffff', '#ffd700', '#ff3366', '#a78bfa'];
    for (let i = 0; i < 160; i++) {
      this.particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 + 50,
        vx: (Math.random() - 0.5) * 24,
        vy: (Math.random() - 0.8) * 22,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        alpha: 1,
        decay: Math.random() * 0.012 + 0.008,
      });
    }
    if (!this.animating) {
      this.animating = true;
      this.loop();
    }
  }

  loop() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45; // Gravity
      p.vx *= 0.985;
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > this.canvas.height) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.animating = false;
    }
  }
}

// ==========================================================================
// 4. UI Notification Toast
// ==========================================================================
function showToast(message, icon = '✓') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ==========================================================================
// 5. Currency Converter Helper
// ==========================================================================
function formatCurrency(amountUSD) {
  const curr = CURRENCIES[currentCurrency];
  const converted = amountUSD * curr.rate;
  return curr.format(converted);
}

function updateCurrencyTargets() {
  document.querySelectorAll('[data-currency-target]').forEach((el) => {
    const base = parseFloat(el.getAttribute('data-currency-target'));
    if (!isNaN(base)) {
      el.textContent = formatCurrency(base);
    }
  });
  renderCart();
  updateCustomizerTotal();
}

// ==========================================================================
// 6. Hero 3D Parallax Tilt Effect
// ==========================================================================
function initHeroParallax() {
  const stage = document.getElementById('heroStage');
  const card = document.getElementById('heroImageCard');
  if (!stage || !card) return;

  let bounds = stage.getBoundingClientRect();
  window.addEventListener('resize', () => {
    bounds = stage.getBoundingClientRect();
  });

  stage.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;
    const xPct = (mouseX / bounds.width - 0.5) * 2; // -1 to 1
    const yPct = (mouseY / bounds.height - 0.5) * 2;

    const rotX = -yPct * 14;
    const rotY = xPct * 18;

    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;

    // Floating badges parallax
    stage.querySelectorAll('.floating-badge').forEach((badge) => {
      const speed = parseFloat(badge.dataset.tiltSpeed) || 0.05;
      const bX = xPct * 25 * speed * 10;
      const bY = yPct * 25 * speed * 10;
      badge.style.transform = `translate3d(${bX}px, ${bY}px, 20px)`;
    });
  });

  stage.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    stage.querySelectorAll('.floating-badge').forEach((badge) => {
      badge.style.transform = 'translate3d(0, 0, 0)';
    });
  });
}

// ==========================================================================
// 7. Hero Colorway Switcher
// ==========================================================================
function initHeroColorSwitcher() {
  const chips = document.querySelectorAll('.hero-color-picker .color-chip');
  const heroImg = document.getElementById('heroMainImage');
  const heroGlow = document.getElementById('heroGlow');

  const colorThemes = {
    black: {
      glow: 'rgba(41, 151, 255, 0.12)',
    },
    silver: {
      glow: 'rgba(255, 255, 255, 0.14)',
    },
    midnight: {
      glow: 'rgba(25, 35, 56, 0.35)',
    }
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const color = chip.dataset.color;
      const imgSrc = chip.dataset.image;

      if (heroImg) {
        heroImg.style.opacity = '0';
        heroImg.style.transform = 'scale(0.96)';
        setTimeout(() => {
          heroImg.src = imgSrc;
          heroImg.style.opacity = '1';
          heroImg.style.transform = 'scale(1)';
        }, 180);
      }

      if (product3D) {
        product3D.setColorway(color);
      }

      if (heroGlow && colorThemes[color]) {
        heroGlow.style.background = `radial-gradient(circle, ${colorThemes[color].glow} 0%, transparent 70%)`;
      }

      audio.playClick();
    });
  });
}

// ==========================================================================
// 7.1. Hero 3D Multi-Product Studio Setup
// ==========================================================================
function initHero3D() {
  try {
    product3D = new Product3DViewer('headphone3DContainer');
    window.product3D = product3D;

    const spinBtn = document.getElementById('toggle3dSpinBtn');
    if (spinBtn) {
      spinBtn.addEventListener('click', () => {
        const state = product3D.toggleAutoRotate();
        spinBtn.classList.toggle('active', state);
        audio.playClick();
      });
    }

    const resetBtn = document.getElementById('reset3dViewBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        product3D.resetView();
        audio.playClick();
        showToast('Reset 3D camera angle');
      });
    }

    // Hero Product Tabs
    const heroTitle = document.querySelector('.hero-title');
    const heroSub = document.querySelector('.hero-subtitle');
    const heroPrice = document.querySelector('.hero-price');
    const heroTag = document.querySelector('.hero-tag');
    const heroBuyBtnPrice = document.querySelector('#heroBuyBtn [data-currency-target]');

    const productMeta = {
      'aura-max': {
        tag: 'FLAGSHIP SPECIFICATION // GEN 2',
        title: 'AURA MAX 2',
        subtitle: 'Pure Acoustic Silence. Milled Titanium Resonance.',
        price: 549,
        badge1: { title: 'Lossless 24-Bit', sub: '192kHz Spatial Sound' },
        badge2: { title: '48-Hour Reserve', sub: 'USB-C Quick Boost 10m=5h' }
      },
      'aura-pods': {
        tag: 'TRUE WIRELESS // SPATIAL AUDIO',
        title: 'AURA PODS PRO',
        subtitle: 'Sculpted Titanium Capsule with Active Spatial Head Tracking.',
        price: 279,
        badge1: { title: 'Spatial Audio', sub: 'Dynamic Head Tracking' },
        badge2: { title: '36-Hour Total', sub: 'Qi2 Wireless Titanium Case' }
      },
      'aura-watch': {
        tag: 'BIOMETRIC WEARABLE // TITANIUM 49MM',
        title: 'AURA KINETIC WATCH',
        subtitle: 'Nike-Inspired Sports Loop with Sapphire Crystal Telemetry.',
        price: 429,
        badge1: { title: 'Aerospace Ti', sub: 'Grade-5 49mm Enclosure' },
        badge2: { title: 'Sapphire Glass', sub: '3000-Nit OLED Telemetry' }
      },
      'aura-runner': {
        tag: 'CARBON PROPULSION // KINETIC LAB',
        title: 'KINETIC AERO RUNNER',
        subtitle: 'Curved Carbon Fiber Plate with Supercritical Nitrogen Foam.',
        price: 220,
        badge1: { title: 'Carbon Plate', sub: 'Full-Length Propulsion Blade' },
        badge2: { title: 'AetherFoam', sub: 'Supercritical Nitrogen Matrix' }
      }
    };

    const b1Title = document.getElementById('badgeTopLeftTitle');
    const b1Sub = document.getElementById('badgeTopLeftSubtitle');
    const b2Title = document.getElementById('badgeBottomRightTitle');
    const b2Sub = document.getElementById('badgeBottomRightSubtitle');

    document.querySelectorAll('.hero-product-tabs .hero-prod-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const currentTab = e.currentTarget;
        const model = currentTab.dataset.model;
        if (!model) return;

        document.querySelectorAll('.hero-product-tabs .hero-prod-tab').forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        currentTab.classList.add('active');
        currentTab.setAttribute('aria-selected', 'true');

        if (product3D) {
          product3D.switchProduct(model);
        }
        audio.playClick();

        const meta = productMeta[model];
        if (meta) {
          if (heroTag) heroTag.textContent = meta.tag;
          if (heroTitle) heroTitle.textContent = meta.title;
          if (heroSub) heroSub.textContent = meta.subtitle;
          if (heroPrice) {
            heroPrice.setAttribute('data-currency-target', meta.price);
            heroPrice.textContent = formatCurrency(meta.price);
          }
          if (heroBuyBtnPrice) {
            heroBuyBtnPrice.setAttribute('data-currency-target', meta.price);
            heroBuyBtnPrice.textContent = formatCurrency(meta.price);
          }
          if (b1Title && meta.badge1) b1Title.textContent = meta.badge1.title;
          if (b1Sub && meta.badge1) b1Sub.textContent = meta.badge1.sub;
          if (b2Title && meta.badge2) b2Title.textContent = meta.badge2.title;
          if (b2Sub && meta.badge2) b2Sub.textContent = meta.badge2.sub;
        }
        showToast(`Viewing 3D Model: ${meta ? meta.title : model}`);
      });
    });

    // Catalog card 3D buttons
    document.querySelectorAll('[data-switch-3d]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const modelId = btn.dataset.switch3d;
        const tab = document.querySelector(`.hero-product-tabs [data-model="${modelId}"]`);
        if (tab) tab.click();
        const heroEl = document.getElementById('hero');
        if (heroEl) heroEl.scrollIntoView({ behavior: 'smooth' });
      });
    });

    window.switchAuraProduct = (modelId) => {
      const tab = document.querySelector(`.hero-product-tabs [data-model="${modelId}"]`);
      if (tab) tab.click();
    };
    window.product3D = product3D;

  } catch (err) {
    console.error('Failed to init 3D viewer:', err);
  }
}

// ==========================================================================
// 8. Interactive Studio Customizer (Personalized Headphone & Engraving)
// ==========================================================================
let customizerState = {
  finish: 'Obsidian Black',
  finishImg: '/assets/images/hero-black.jpg',
  cushion: 'AeroKnit Breathable',
  cushionExtra: 0,
  engraving: ''
};

function updateCustomizerTotal() {
  const basePrice = 549;
  const total = basePrice + customizerState.cushionExtra;
  const priceEl = document.getElementById('customTotalPrice');
  if (priceEl) {
    priceEl.setAttribute('data-currency-target', total);
    priceEl.textContent = formatCurrency(total);
  }

  const summaryEl = document.getElementById('customSummary');
  if (summaryEl) {
    const engText = customizerState.engraving ? `"${customizerState.engraving}"` : 'No Engraving';
    summaryEl.textContent = `${customizerState.finish} · ${customizerState.cushion} · ${engText}`;
  }
}

function initCustomizer() {
  const previewImg = document.getElementById('customizerPreviewImg');
  const engravingInput = document.getElementById('engravingInput');
  const engravingPreview = document.getElementById('engravingPreviewText');
  const charCount = document.getElementById('charCount');

  // Finish Chips
  document.querySelectorAll('.custom-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.custom-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const colorName = chip.querySelector('span:last-child').textContent;
      const imgPath = chip.dataset.img;

      customizerState.finish = colorName;
      customizerState.finishImg = imgPath;

      if (previewImg) {
        previewImg.style.opacity = '0';
        setTimeout(() => {
          previewImg.src = imgPath;
          previewImg.style.opacity = '1';
        }, 150);
      }

      updateCustomizerTotal();
      audio.playClick();
    });
  });

  // Cushion Chips
  document.querySelectorAll('.cushion-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cushion-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      customizerState.cushion = chip.dataset.cushion;
      customizerState.cushionExtra = parseInt(chip.dataset.extra || 0, 10);

      updateCustomizerTotal();
      audio.playClick();
    });
  });

  // Engraving Input
  if (engravingInput && engravingPreview && charCount) {
    engravingInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toUpperCase();
      charCount.textContent = `${e.target.value.length}/16`;
      customizerState.engraving = val;
      engravingPreview.textContent = val.length > 0 ? val : 'YOUR NAME';
      updateCustomizerTotal();
    });
  }

  // Add Custom Edition to Bag
  const addBtn = document.getElementById('addCustomToBagBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const customItem = {
        id: `custom-max-${Date.now()}`,
        productId: 'aura-max',
        name: `Aura Max 2 (Bespoke Studio Edition)`,
        variant: `${customizerState.finish} · ${customizerState.cushion}${customizerState.engraving ? ' · Engraved: "' + customizerState.engraving + '"' : ''}`,
        price: 549 + customizerState.cushionExtra,
        image: customizerState.finishImg,
        qty: 1
      };

      addToCart(customItem);
      audio.playSuccessChime();
      showToast(`Added Bespoke Aura Max 2 to Bag`);
      openCartDrawer();
    });
  }
}

// ==========================================================================
// 9. Shopping Cart System (Slide-over Drawer & Confetti Checkout)
// ==========================================================================
function addToCart(item) {
  const existing = cartState.find((i) => i.id === item.id);
  if (existing) {
    existing.qty += (item.qty || 1);
  } else {
    cartState.push({
      ...item,
      qty: item.qty || 1
    });
  }

  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const badge = document.getElementById('cartCountBadge');
  const drawerCount = document.getElementById('cartDrawerCount');
  const totalQty = cartState.reduce((sum, item) => sum + item.qty, 0);

  if (badge) {
    badge.textContent = totalQty;
    badge.classList.add('bounce');
    setTimeout(() => badge.classList.remove('bounce'), 300);
  }
  if (drawerCount) {
    drawerCount.textContent = `(${totalQty} item${totalQty === 1 ? '' : 's'})`;
  }
}

function renderCart() {
  const listEl = document.getElementById('cartItemsList');
  const subtotalEl = document.getElementById('cartSubtotal');
  const discountRow = document.getElementById('discountRow');
  const discountEl = document.getElementById('cartDiscount');
  const totalEl = document.getElementById('cartTotal');
  const meterLabel = document.getElementById('shippingMeterLabel');
  const progressBar = document.getElementById('shippingProgressBar');

  if (!listEl) return;

  if (cartState.length === 0) {
    listEl.innerHTML = `
      <div class="cart-empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <p>Your bag is currently empty.</p>
        <button class="btn btn-secondary" onclick="document.getElementById('closeCartBtn').click(); location.href='#catalog'">
          Explore Collection
        </button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = formatCurrency(0);
    if (totalEl) totalEl.textContent = formatCurrency(0);
    if (discountRow) discountRow.classList.add('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (meterLabel) {
      meterLabel.innerHTML = `Add <strong>${formatCurrency(FREE_SHIPPING_THRESHOLD)}</strong> for Free Express Worldwide Shipping`;
    }
    return;
  }

  // Render items
  listEl.innerHTML = cartState.map((item) => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-variant">${item.variant}</div>
        <div class="cart-item-price">${formatCurrency(item.price * item.qty)}</div>
        <div class="cart-item-stepper">
          <button class="stepper-btn decrease-qty" data-id="${item.id}" aria-label="Decrease">&minus;</button>
          <span class="stepper-qty">${item.qty}</span>
          <button class="stepper-btn increase-qty" data-id="${item.id}" aria-label="Increase">&plus;</button>
        </div>
      </div>
      <button class="cart-item-remove remove-item" data-id="${item.id}" aria-label="Remove item">&times;</button>
    </div>
  `).join('');

  // Calculate totals
  const subtotal = cartState.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmt = subtotal * appliedDiscount;
  const finalTotal = Math.max(0, subtotal - discountAmt);

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);

  if (discountRow && discountEl) {
    if (appliedDiscount > 0) {
      discountRow.classList.remove('hidden');
      discountEl.textContent = `-${formatCurrency(discountAmt)}`;
    } else {
      discountRow.classList.add('hidden');
    }
  }

  if (totalEl) totalEl.textContent = formatCurrency(finalTotal);

  // Free shipping meter
  if (progressBar && meterLabel) {
    const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
    progressBar.style.width = `${progress}%`;

    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      meterLabel.innerHTML = `🎉 <strong>Congratulations!</strong> You unlocked Free Worldwide Express Shipping.`;
    } else {
      const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
      meterLabel.innerHTML = `Add <strong>${formatCurrency(remaining)}</strong> for <strong>Free Worldwide Shipping</strong>`;
    }
  }

  // Stepper & Remove Event Handlers
  listEl.querySelectorAll('.increase-qty').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const target = cartState.find((i) => i.id === id);
      if (target) {
        target.qty += 1;
        updateCartBadge();
        renderCart();
        audio.playClick();
      }
    });
  });

  listEl.querySelectorAll('.decrease-qty').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const target = cartState.find((i) => i.id === id);
      if (target) {
        if (target.qty > 1) {
          target.qty -= 1;
        } else {
          cartState = cartState.filter((i) => i.id !== id);
        }
        updateCartBadge();
        renderCart();
        audio.playClick();
      }
    });
  });

  listEl.querySelectorAll('.remove-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      cartState = cartState.filter((i) => i.id !== id);
      updateCartBadge();
      renderCart();
      audio.playClick();
      showToast('Item removed from bag');
    });
  });
}

function openCartDrawer() {
  const overlay = document.getElementById('cartOverlay');
  if (overlay) {
    overlay.classList.add('open');
    renderCart();
  }
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartOverlay');
  if (overlay) {
    overlay.classList.remove('open');
  }
}

function initCartDrawer() {
  const openBtn = document.getElementById('openCartBtn');
  const closeBtn = document.getElementById('closeCartBtn');
  const overlay = document.getElementById('cartOverlay');

  if (openBtn) openBtn.addEventListener('click', openCartDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeCartDrawer();
    });
  }

  // Promo code
  const promoInput = document.getElementById('promoInput');
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoMsg = document.getElementById('promoMessage');

  if (applyPromoBtn && promoInput && promoMsg) {
    applyPromoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'AURA10' || code === 'APPLE' || code === 'NIKE') {
        appliedDiscount = 0.1;
        promoMsg.className = 'promo-message success';
        promoMsg.textContent = `Promo "${code}" applied: 10% Off your total!`;
        audio.playSuccessChime();
        renderCart();
      } else if (code.length === 0) {
        promoMsg.className = 'promo-message error';
        promoMsg.textContent = 'Please enter a valid promo code.';
      } else {
        promoMsg.className = 'promo-message error';
        promoMsg.textContent = 'Invalid promo code. Try: AURA10';
      }
    });
  }

  // Checkout with Confetti Cannon
  const cannon = new ConfettiCannon('confettiCanvas');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutOverlay = document.getElementById('checkoutSuccessOverlay');
  const closeSuccessBtn = document.getElementById('closeCheckoutSuccessBtn');

  if (checkoutBtn && checkoutOverlay) {
    checkoutBtn.addEventListener('click', () => {
      if (cartState.length === 0) {
        showToast('Your bag is currently empty.');
        return;
      }

      closeCartDrawer();
      checkoutOverlay.classList.add('open');
      audio.playSuccessChime();
      cannon.fire();

      // Reset cart
      cartState = [];
      appliedDiscount = 0;
      updateCartBadge();
    });
  }

  if (closeSuccessBtn && checkoutOverlay) {
    closeSuccessBtn.addEventListener('click', () => {
      checkoutOverlay.classList.remove('open');
    });
  }
}

// ==========================================================================
// 10. Product Catalog & Quick View Modal
// ==========================================================================
function initCatalog() {
  // Category Filtering
  const filterBtns = document.querySelectorAll('.catalog-filters .filter-chip');
  const cards = document.querySelectorAll('.product-grid .product-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      audio.playClick();

      cards.forEach((card) => {
        const cat = card.dataset.category;
        if (filter === 'all' || cat === filter) {
          card.classList.remove('hidden');
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(16px)';
          setTimeout(() => card.classList.add('hidden'), 250);
        }
      });
    });
  });

  // Direct Card Add Buttons
  document.querySelectorAll('[data-add-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.addId;
      const product = PRODUCTS.find((p) => p.id === id);
      if (product) {
        addToCart({
          id: product.id,
          productId: product.id,
          name: product.name,
          variant: 'Standard Edition',
          price: product.basePrice,
          image: product.image,
          qty: 1
        });
        audio.playClick();
        showToast(`Added ${product.name} to Bag`);
        openCartDrawer();
      }
    });
  });

  // Hero Add to Bag Button
  const heroBuyBtn = document.getElementById('heroBuyBtn');
  if (heroBuyBtn) {
    heroBuyBtn.addEventListener('click', () => {
      const activeColorChip = document.querySelector('.hero-color-picker .color-chip.active');
      const colorName = activeColorChip ? activeColorChip.querySelector('.chip-label').textContent : 'Obsidian Black';
      const imgSrc = activeColorChip ? activeColorChip.dataset.image : '/assets/images/hero-black.jpg';

      addToCart({
        id: `aura-max-${colorName.toLowerCase().replace(/\s+/g, '-')}`,
        productId: 'aura-max',
        name: 'Aura Max 2',
        variant: colorName,
        price: 549,
        image: imgSrc,
        qty: 1
      });
      audio.playClick();
      showToast(`Added Aura Max 2 (${colorName}) to Bag`);
      openCartDrawer();
    });
  }

  // Wishlist Hearts
  document.querySelectorAll('.wishlist-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.toggle('active');
      const isActive = btn.classList.contains('active');
      audio.playClick();
      showToast(isActive ? 'Saved to your Wishlist' : 'Removed from Wishlist', '♥');
    });
  });

  // Quick View Modal
  const qvOverlay = document.getElementById('quickViewOverlay');
  const qvContent = document.getElementById('quickViewContent');
  const closeQvBtn = document.getElementById('closeQuickViewBtn');

  document.querySelectorAll('[data-quickview]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const id = trigger.dataset.quickview;
      const product = PRODUCTS.find((p) => p.id === id);
      if (!product || !qvContent) return;

      qvContent.innerHTML = `
        <div class="qv-img-box">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="qv-details-box">
          <span class="qv-tag">${product.tag} // ${product.categoryName}</span>
          <h2 class="qv-title">${product.name}</h2>
          <div class="qv-price">${formatCurrency(product.basePrice)}</div>
          <p class="qv-desc">${product.description}</p>
          <ul class="qv-features-list">
            ${product.features.map((f) => `<li>${f}</li>`).join('')}
          </ul>
          <button class="btn btn-primary" id="qvAddBtn">
            <span>Add to Bag — ${formatCurrency(product.basePrice)}</span>
          </button>
        </div>
      `;

      qvOverlay.classList.add('open');
      audio.playClick();

      document.getElementById('qvAddBtn').addEventListener('click', () => {
        addToCart({
          id: product.id,
          productId: product.id,
          name: product.name,
          variant: 'Standard Edition',
          price: product.basePrice,
          image: product.image,
          qty: 1
        });
        qvOverlay.classList.remove('open');
        showToast(`Added ${product.name} to Bag`);
        openCartDrawer();
      });
    });
  });

  if (closeQvBtn && qvOverlay) {
    closeQvBtn.addEventListener('click', () => qvOverlay.classList.remove('open'));
    qvOverlay.addEventListener('click', (e) => {
      if (e.target === qvOverlay) qvOverlay.classList.remove('open');
    });
  }
}

// ==========================================================================
// 11. Spotlight Search Modal (Cmd + K)
// ==========================================================================
function initSpotlightSearch() {
  const overlay = document.getElementById('searchOverlay');
  const input = document.getElementById('spotlightInput');
  const resultsContainer = document.getElementById('searchResults');
  const openBtn = document.getElementById('openSearchBtn');
  const closeBtn = document.getElementById('closeSearchBtn');

  function openSearch() {
    if (!overlay) return;
    overlay.classList.add('open');
    if (input) {
      input.value = '';
      input.focus();
      renderSearchResults('');
    }
  }

  function closeSearch() {
    if (overlay) overlay.classList.remove('open');
  }

  if (openBtn) openBtn.addEventListener('click', openSearch);
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSearch();
    });
  }

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (overlay && overlay.classList.contains('open')) closeSearch();
      else openSearch();
    } else if (e.key === 'Escape') {
      closeSearch();
      closeCartDrawer();
      const qvOverlay = document.getElementById('quickViewOverlay');
      if (qvOverlay) qvOverlay.classList.remove('open');
    }
  });

  // Live filter results
  function renderSearchResults(term) {
    if (!resultsContainer) return;
    const clean = term.toLowerCase().trim();

    const matches = PRODUCTS.filter((p) => {
      return (
        p.name.toLowerCase().includes(clean) ||
        p.summary.toLowerCase().includes(clean) ||
        p.category.toLowerCase().includes(clean) ||
        p.features.some((f) => f.toLowerCase().includes(clean))
      );
    });

    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-secondary); font-size: 0.88rem;">
          No matching acoustic instruments found for "<strong>${term}</strong>"
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = matches.map((item) => `
      <div class="search-result-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="search-result-thumb">
        <div class="search-result-info">
          <div class="search-result-title">${item.name}</div>
          <div class="search-result-cat">${item.categoryName}</div>
        </div>
        <div class="search-result-price">${formatCurrency(item.basePrice)}</div>
      </div>
    `).join('');

    resultsContainer.querySelectorAll('.search-result-item').forEach((itemEl) => {
      itemEl.addEventListener('click', () => {
        const id = itemEl.dataset.id;
        closeSearch();
        const trigger = document.querySelector(`[data-quickview="${id}"]`);
        if (trigger) trigger.click();
      });
    });
  }

  if (input) {
    input.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });
  }

  // Quick tag search buttons
  document.querySelectorAll('.tag-pill').forEach((tag) => {
    tag.addEventListener('click', () => {
      const term = tag.dataset.searchTerm;
      if (input) {
        input.value = term;
        renderSearchResults(term);
      }
    });
  });
}

// ==========================================================================
// 12. Audio Lab Controls & ANC Slider
// ==========================================================================
function initAudioLab() {
  const playBtn = document.getElementById('audioPlayBtn');
  const playBtnText = document.getElementById('audioPlayBtnText');
  const playIcon = playBtn?.querySelector('.play-icon');
  const pauseIcon = playBtn?.querySelector('.pause-icon');
  const beacon = document.getElementById('audioBeacon');
  const statusText = document.getElementById('audioStatusText');
  const ancSlider = document.getElementById('ancRangeSlider');
  const ancValueDisplay = document.getElementById('ancValueDisplay');
  const ancStatusCaption = document.getElementById('ancStatusCaption');
  const currentDbTag = document.getElementById('currentDbTag');

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (audio.isPlaying) {
        audio.stopDemoAudio();
        playBtnText.textContent = 'Play Spatial Audio Test';
        playIcon?.classList.remove('hidden');
        pauseIcon?.classList.add('hidden');
        beacon?.classList.remove('active');
        if (statusText) statusText.textContent = 'Spatial Engine Standby';
      } else {
        audio.startDemoAudio();
        playBtnText.textContent = 'Pause Spatial Sound';
        playIcon?.classList.add('hidden');
        pauseIcon?.classList.remove('hidden');
        beacon?.classList.add('active');
        if (statusText) statusText.textContent = 'Live Spatial Audio Synthesizer Active';
        showToast('Spatial Audio Engine Synthesizing (Pure Web Audio)');
      }
    });
  }

  // Audio Modes
  document.querySelectorAll('.audio-mode-selector .mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.audio-mode-selector .mode-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.mode;
      audio.setMode(mode);
      audio.playClick();
    });
  });

  // ANC Slider
  if (ancSlider && ancValueDisplay && ancStatusCaption) {
    ancSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      audio.setAncLevel(val);
      ancValueDisplay.textContent = `${val}% Active`;

      const dbAtten = (val * 0.5).toFixed(1);
      ancStatusCaption.innerHTML = `Anti-phase wave filtering <strong>-${dbAtten} dB</strong> ambient interference.`;
      if (currentDbTag) {
        currentDbTag.textContent = `-${(30 + val * 0.28).toFixed(1)} dB Noise Floor`;
      }
    });
  }
}

// ==========================================================================
// 13. Currency Selector & Theme Toggle
// ==========================================================================
function initSettings() {
  // Currency Menu
  const currBtn = document.getElementById('currencyBtn');
  const currMenu = document.getElementById('currencyMenu');
  const currentCurrLabel = document.getElementById('currentCurrency');

  if (currBtn && currMenu) {
    currBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currMenu.classList.toggle('open');
    });

    window.addEventListener('click', () => {
      currMenu.classList.remove('open');
    });

    document.querySelectorAll('.currency-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.currency-option').forEach((o) => o.classList.remove('active'));
        opt.classList.add('active');

        currentCurrency = opt.dataset.currency;
        if (currentCurrLabel) {
          currentCurrLabel.textContent = `${currentCurrency} (${CURRENCIES[currentCurrency].symbol})`;
        }
        currMenu.classList.remove('open');
        updateCurrencyTargets();
        audio.playClick();
        showToast(`Currency set to ${currentCurrency}`);
      });
    });
  }

  // Sound FX Toggle
  const soundToggle = document.getElementById('soundToggle');
  const soundOn = soundToggle?.querySelector('.sound-icon-on');
  const soundOff = soundToggle?.querySelector('.sound-icon-off');

  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      soundEffectsEnabled = !soundEffectsEnabled;
      soundOn?.classList.toggle('hidden', !soundEffectsEnabled);
      soundOff?.classList.toggle('hidden', soundEffectsEnabled);
      if (soundEffectsEnabled) audio.playClick();
      showToast(soundEffectsEnabled ? 'Sound feedback ON' : 'Sound feedback muted');
    });
  }

  // Theme Toggle (Dark / Light)
  const themeToggle = document.getElementById('themeToggle');
  const darkIcon = themeToggle?.querySelector('.theme-icon-dark');
  const lightIcon = themeToggle?.querySelector('.theme-icon-light');

  const savedTheme = localStorage.getItem('aether-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'light') {
    darkIcon?.classList.add('hidden');
    lightIcon?.classList.remove('hidden');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('aether-theme', next);

      darkIcon?.classList.toggle('hidden', next === 'light');
      lightIcon?.classList.toggle('hidden', next === 'dark');

      audio.playClick();
      showToast(`Switched to ${next === 'dark' ? 'Obsidian Dark' : 'Starlight Light'} Theme`);
    });
  }

  // Announcement Bar dismiss
  const closeAnnouncement = document.getElementById('closeAnnouncement');
  const announcementBar = document.getElementById('announcementBar');
  if (closeAnnouncement && announcementBar) {
    closeAnnouncement.addEventListener('click', () => {
      announcementBar.classList.add('hidden');
    });
  }

  // Mobile Menu
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  if (mobileBtn && navMenu) {
    mobileBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
    navMenu.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => navMenu.classList.remove('open'));
    });
  }

  // Newsletter Form
  const newsForm = document.getElementById('newsletterForm');
  const newsFeedback = document.getElementById('newsletterFeedback');
  if (newsForm && newsFeedback) {
    newsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletterEmail').value;
      newsFeedback.textContent = `✓ Subscribed ${email}. Welcome to Aether Labs.`;
      audio.playSuccessChime();
      newsForm.reset();
    });
  }
}

// ==========================================================================
// 14. Scroll Reveal Animations
// ==========================================================================
function initScrollObserver() {
  const reveals = document.querySelectorAll('.reveal-item');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  reveals.forEach((el) => observer.observe(el));
}

// ==========================================================================
// App Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initHero3D();
  initHeroParallax();
  initHeroColorSwitcher();
  initCustomizer();
  initCartDrawer();
  initCatalog();
  initSpotlightSearch();
  initSettings();
  initScrollObserver();
  updateCurrencyTargets();
});
