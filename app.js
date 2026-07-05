import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCO-9ffr9W9WEiEWOWnHtCFKSu-y7YpjOs",
  authDomain: "dennys-sanitation.firebaseapp.com",
  projectId: "dennys-sanitation",
  storageBucket: "dennys-sanitation.firebasestorage.app",
  messagingSenderId: "860390471132",
  appId: "1:860390471132:web:a3aac29099e2873c950b19"
};

let db;
try { const app = initializeApp(firebaseConfig); db = getFirestore(app); } catch(e) { console.warn('Firebase not configured \u2014 running in static mode.'); }

// ── Skeleton Loader ──
document.addEventListener('DOMContentLoaded', () => {
  const skeleton = document.getElementById('skeleton-loader');
  if (skeleton) {
    skeleton.classList.add('fade-out');
    skeleton.addEventListener('transitionend', () => skeleton.remove(), { once: true });
  }
});

// ── Scroll Progress Bar ──
const progressBar = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const scrollTop = document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  progressBar.style.width = (scrollTop / docHeight * 100) + '%';
}, { passive: true });

// ── Nav Scroll Effect ──
const nav = document.getElementById('nav');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── Nav Toggle ──
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
navToggle.addEventListener('click', () => {
  const isOpen = navToggle.classList.toggle('open');
  navMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navToggle.classList.remove('open');
  navMenu.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}));
// Close mobile nav with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navMenu.classList.contains('open')) {
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.focus();
  }
});

// ── Mobile Call Button ──
const mobileCall = document.getElementById('mobile-call');
window.addEventListener('scroll', () => {
  mobileCall.classList.toggle('visible', window.scrollY > window.innerHeight * 0.6);
}, { passive: true });

// ── Counter Animation ──
function animateCounter(el) {
  if (el.dataset.animated) return;
  const target = parseInt(el.dataset.count);
  const duration = 1800;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    el.textContent = Math.round(target * eased) + (progress >= 1 ? '+' : '');
    if (progress < 1) requestAnimationFrame(tick);
  }
  el.dataset.animated = '1';
  requestAnimationFrame(tick);
}

function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => animateCounter(el));
}

// Fire hero counters immediately on page load
document.querySelectorAll('[data-hero][data-count]').forEach(el => animateCounter(el));

// ── Scroll Reveal ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Trigger counter animation if stats are in view
      if (entry.target.querySelector('[data-count]') || entry.target.hasAttribute('data-count')) {
        animateCounters();
      }
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Hours: Today Highlight + Open/Closed ──
(function highlightToday() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const hour = now.getHours();
  const minute = now.getMinutes();
  const rows = document.querySelectorAll('#hours-table tr');
  const dayMap = [6, 0, 1, 2, 3, 4, 5]; // Sun=6, Mon=0...
  const todayIdx = dayMap[day];
  rows.forEach((r, i) => {
    if (i === todayIdx) r.classList.add('today');
    if (i >= 5) r.classList.add('closed');
  });

  const statusEl = document.getElementById('hours-status');
  const statusText = document.getElementById('hours-status-text');
  const currentMinutes = hour * 60 + minute;
  let isOpen = false;
  if (day >= 1 && day <= 4) isOpen = currentMinutes >= 420 && currentMinutes < 1020;
  else if (day === 5) isOpen = currentMinutes >= 420 && currentMinutes < 840;

  if (isOpen) {
    statusEl.className = 'hours-status open-now';
    statusText.textContent = 'Open Now';
  } else {
    statusEl.className = 'hours-status closed-now';
    statusText.textContent = 'Closed';
  }
})();

// ── Service Card Toggle (delegated) ──
document.addEventListener('click', (e) => {
  const header = e.target.closest('.s-card-header');
  if (!header) return;
  const card = header.closest('.s-card');
  if (!card) return;
  card.classList.toggle('open');
  header.setAttribute('aria-expanded', card.classList.contains('open'));
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const header = e.target.closest('.s-card-header');
  if (!header) return;
  e.preventDefault();
  header.click();
});

// ── FAQ Accordion ──
document.querySelectorAll('.faq-trigger').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    const isOpen = answer.classList.contains('open');
    // Close all
    document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
    // Open clicked if it was closed
    if (!isOpen) {
      answer.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// ── Route Notices (Firebase) ──
async function loadNotices() {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'notices'));
    const today = new Date(); today.setHours(0,0,0,0);
    const notices = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.expires) { const exp = new Date(data.expires + 'T23:59:59'); if (exp < today) return; }
      notices.push({ id: d.id, ...data });
    });
    notices.sort((a,b) => (a.order||0) - (b.order||0));
    renderNotices(notices);
  } catch(e) { console.warn('Could not load notices:', e); }
}

function renderNotices(notices) {
  const section = document.getElementById('notices-section');
  const list = document.getElementById('notices-list');
  if (!notices.length) { section.classList.remove('visible'); return; }
  section.classList.add('visible');
  list.innerHTML = notices.map(n => `
    <div class="notice">
      <p class="notice-heading">${esc(n.title)}</p>
      <p class="notice-text">${esc(n.body)}</p>
    </div>`).join('');
}

// ── Site Config (Firebase) ──
async function loadConfig() {
  if (!db) return;
  try {
    const snap = await getDoc(doc(db, 'config', 'site'));
    if (!snap.exists()) return;
    const cfg = snap.data();
    if (cfg.announcement && cfg.announcement.trim()) {
      const bar = document.getElementById('announcement-bar');
      const hero = document.querySelector('.hero');
      bar.textContent = cfg.announcement;
      bar.classList.add('visible');
      if (hero) hero.classList.add('with-announcement');
    }
    if (cfg.hoursOverride && cfg.hoursOverride.trim()) {
      const el = document.getElementById('hours-override');
      el.textContent = cfg.hoursOverride;
      el.classList.add('visible');
    }
    // ── Headings ──
    if (cfg.headings && typeof cfg.headings === 'object') {
      Object.keys(cfg.headings).forEach(key => {
        const el = document.getElementById(key);
        if (el && cfg.headings[key]) el.textContent = cfg.headings[key];
      });
    }
    // ── Hours ──
    if (cfg.hours && typeof cfg.hours === 'object') {
      const dayOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
      const table = document.getElementById('hours-table');
      if (table) {
        const rows = table.querySelectorAll('tr');
        dayOrder.forEach((day, i) => {
          if (cfg.hours[day] && rows[i]) {
            const h = cfg.hours[day];
            const timeCell = rows[i].querySelectorAll('td')[1];
            if (timeCell) {
              if (h.open === false) {
                timeCell.textContent = 'Closed';
                rows[i].classList.add('closed');
              } else {
                timeCell.textContent = (h.from || '7:00 AM') + ' \u2013 ' + (h.to || '5:00 PM');
                rows[i].classList.remove('closed');
              }
            }
          }
        });
      }
    }
    // ── Contact ──
    if (cfg.contact && typeof cfg.contact === 'object') {
      const c = cfg.contact;
      if (c.phone) {
        const phoneDigits = c.phone.replace(/\D/g, '');
        document.querySelectorAll('a[href^="tel:"]').forEach(a => {
          a.href = 'tel:+1' + phoneDigits;
          if (a.textContent.match(/\(\d{3}\)/)) a.textContent = c.phone;
          if (a.closest('.btn')) {
            const svg = a.querySelector('svg');
            if (svg) { a.textContent = ''; a.prepend(svg); a.append(' Call ' + c.phone); }
          }
        });
      }
      if (c.email) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
          a.href = 'mailto:' + c.email;
          if (a.textContent.includes('@')) a.textContent = c.email;
        });
      }
      if (c.address) {
        document.querySelectorAll('.contact-item-value').forEach(el => {
          if (el.textContent.includes('Union Street') || el.textContent.includes('Rock Rapids')) {
            if (!el.querySelector('a')) el.textContent = c.address;
          }
        });
      }
    }
  } catch(e) { console.warn('Could not load config:', e); }
}

// ── Services (Firebase) ──
async function loadServices() {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'services'));
    if (snap.empty) return;
    const services = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.active === false) return;
      services.push({ id: d.id, ...data });
    });
    services.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!services.length) return;
    const container = document.querySelector('.services-bento');
    if (!container) return;
    container.innerHTML = services.map((s, i) => {
      const delay = (i % 3) + 1;
      const imgHtml = s.img ? `<div class="s-card-img"><img src="${esc(s.img)}" alt="${esc(s.name)}" loading="lazy"></div>` : '';
      const detailHtml = s.details ? `<div class="s-card-detail">${s.details}</div>` : '';
      return `<div class="s-card reveal reveal-delay-${delay}" data-service-tag="${esc(s.tag || '')}">
        ${imgHtml}
        <div class="s-card-header" role="button" tabindex="0" aria-expanded="false">
          <div class="s-card-header-left"><div class="s-card-tag">${esc(s.tag || '')}</div><h3>${esc(s.name)}</h3></div>
          <div class="s-card-toggle"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg></div>
        </div>
        <div class="s-card-body"><div class="s-card-body-inner"><div class="s-card-content">
          <p>${esc(s.description || '')}</p>
          ${detailHtml}
        </div></div></div>
      </div>`;
    }).join('');
  } catch(e) { console.warn('Could not load services:', e); }
}

// ── FAQs (Firebase) ──
async function loadFAQs() {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'faqs'));
    if (snap.empty) return;
    const faqs = [];
    snap.forEach(d => faqs.push({ id: d.id, ...d.data() }));
    faqs.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!faqs.length) return;
    const container = document.querySelector('.faq-container');
    if (!container) return;
    container.innerHTML = faqs.map(f => `
      <div class="faq-item reveal">
        <button class="faq-trigger" aria-expanded="false">
          ${esc(f.question)}
          <span class="faq-icon"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg></span>
        </button>
        <div class="faq-answer"><div class="faq-answer-inner"><p class="faq-answer-text">${esc(f.answer)}</p></div></div>
      </div>
    `).join('');
  } catch(e) { console.warn('Could not load FAQs:', e); }
}

// ── Policies (Firebase) ──
async function loadPolicies() {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'policies'));
    if (snap.empty) return;
    const policies = [];
    snap.forEach(d => policies.push({ id: d.id, ...d.data() }));
    policies.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!policies.length) return;
    const container = document.querySelector('.policies-layout');
    if (!container) return;
    const defaultIcons = [
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>',
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></svg>',
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>'
    ];
    container.innerHTML = policies.map((p, i) => {
      const delay = (i % 4) + 1;
      const icon = defaultIcons[i % defaultIcons.length];
      return `<div class="policy reveal reveal-delay-${delay}">
        <div class="policy-icon">${icon}</div>
        <h3>${esc(p.name || p.title || '')}</h3>
        <p>${esc(p.description || p.body || '')}</p>
      </div>`;
    }).join('');
  } catch(e) { console.warn('Could not load policies:', e); }
}

// ── Site Images (Firebase) ──
async function loadSiteImages() {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'siteImages'));
    if (snap.empty) return;
    snap.forEach(d => {
      const data = d.data();
      if (!data.img) return;
      const id = d.id;
      if (id === 'hero') {
        const el = document.getElementById('hero-bg-img');
        if (el) el.src = data.img;
      } else if (id === 'logo') {
        const el = document.getElementById('hours-logo-img');
        if (el) el.src = data.img;
      } else {
        // Match service card images by tag
        const card = document.querySelector(`.s-card[data-service-tag="${id}" i]`);
        if (card) {
          const img = card.querySelector('.s-card-img img');
          if (img) img.src = data.img;
          else {
            // Insert image div before header
            const header = card.querySelector('.s-card-header');
            if (header) {
              const imgDiv = document.createElement('div');
              imgDiv.className = 's-card-img';
              imgDiv.innerHTML = `<img src="${esc(data.img)}" alt="${id}" loading="lazy">`;
              card.insertBefore(imgDiv, header);
            }
          }
        }
      }
    });
  } catch(e) { console.warn('Could not load site images:', e); }
}

// ── Contact Form (EmailJS) ──
let emailjsReady = false;
async function initEmailJS() {
  try {
    const snap = await getDoc(doc(db, 'config', 'emailjs'));
    if (snap.exists()) {
      const cfg = snap.data();
      if (cfg.publicKey && cfg.serviceId && cfg.templateId && typeof emailjs !== 'undefined') {
        emailjs.init(cfg.publicKey);
        window._ejs = { serviceId: cfg.serviceId, templateId: cfg.templateId };
        emailjsReady = true;
      }
    }
  } catch(e) { console.warn('EmailJS config not loaded:', e); }
}
initEmailJS();

let lastSubmitTime = 0;
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  // Honeypot check — silently reject if filled
  const hp = document.getElementById('c-website');
  if (hp && hp.value) { return; }
  // Submission cooldown — 10 seconds between submits
  const now = Date.now();
  if (now - lastSubmitTime < 10000) {
    const msg2 = document.getElementById('contact-msg');
    msg2.className = 'form-feedback error';
    msg2.textContent = 'Please wait a few seconds before submitting again.';
    return;
  }
  lastSubmitTime = now;
  const btn = document.getElementById('contact-btn');
  const msg = document.getElementById('contact-msg');
  btn.disabled = true; btn.textContent = 'Sending...'; msg.className = 'form-feedback';
  if (emailjsReady) {
    try {
      await emailjs.sendForm(window._ejs.serviceId, window._ejs.templateId, this);
      msg.className = 'form-feedback success';
      msg.textContent = "Message sent! We'll get back to you soon.";
      this.reset();
    } catch(err) {
      msg.className = 'form-feedback error';
      msg.textContent = 'Something went wrong. Please call us at (712) 472-2293.';
    }
  } else {
    msg.className = 'form-feedback error';
    msg.textContent = 'Contact form not yet configured. Please email dennysanitation@gmail.com or call (712) 472-2293.';
  }
  btn.disabled = false; btn.textContent = 'Send Message';
});

// ── Utils ──
function esc(str) { if (!str) return ''; const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

// ── Re-init observers & handlers after dynamic content ──
function reinitRevealObservers() {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
}

function reinitFAQHandlers() {
  document.querySelectorAll('.faq-trigger').forEach(btn => {
    // Remove old listener by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      const answer = newBtn.nextElementSibling;
      const isOpen = answer.classList.contains('open');
      document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
      document.querySelectorAll('.faq-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
      if (!isOpen) {
        answer.classList.add('open');
        newBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// ── Init ──
Promise.all([loadNotices(), loadConfig(), loadServices(), loadFAQs(), loadPolicies(), loadSiteImages()])
  .then(() => {
    reinitRevealObservers();
    reinitFAQHandlers();
  })
  .catch(e => console.warn('Loader error:', e));
