// ════════════════════════════════════════════════════════
// FIREBASE
// ════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCO-9ffr9W9WEiEWOWnHtCFKSu-y7YpjOs",
  authDomain: "dennys-sanitation.firebaseapp.com",
  projectId: "dennys-sanitation",
  storageBucket: "dennys-sanitation.firebasestorage.app",
  messagingSenderId: "860390471132",
  appId: "1:860390471132:web:a3aac29099e2873c950b19"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════
let notices  = [];
let services = [];
let faqs     = [];
let policies = [];
let siteConfig = {};

// ════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════
function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = type + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

// Canvas-based image resize: max dimension, JPEG quality
function resizeImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
          else       { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        // Check size (base64 → bytes ~ length * 0.75)
        const sizeKB = Math.round(dataUrl.length * 0.75 / 1024);
        if (sizeKB > 750) {
          reject(new Error(`Image too large after compression (${sizeKB}KB). Try a smaller image.`));
          return;
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Could not read image.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

// Convert 24h time string to 12h AM/PM
function to12h(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`;
}

// Convert "7:00 AM" to "07:00" (24h for input[type=time])
function to24h(str) {
  if (!str) return '08:00';
  const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return '08:00';
  let h = parseInt(match[1]), m = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}

// ════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════
const loginScreen = document.getElementById('login-screen');
const appEl       = document.getElementById('app');

onAuthStateChanged(auth, user => {
  if (user) {
    loginScreen.style.display = 'none';
    appEl.classList.add('visible');
    document.getElementById('header-user').textContent = user.email;
    loadAll();
  } else {
    loginScreen.style.display = 'flex';
    appEl.classList.remove('visible');
  }
});

document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('login-err');
  const btn   = document.getElementById('login-btn');
  if (!email || !pass) { err.textContent = 'Please enter email and password.'; err.style.color = ''; err.classList.add('show'); return; }
  btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    err.classList.remove('show');
    err.style.color = '';
  } catch(e) {
    err.textContent = 'Invalid email or password.';
    err.style.color = '';
    err.classList.add('show');
  }
  btn.disabled = false;
});

document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('login-btn').click();
});

document.getElementById('sign-out-btn').addEventListener('click', () => signOut(auth));

document.getElementById('forgot-btn').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const err   = document.getElementById('login-err');
  if (!email) { err.textContent = 'Enter your email above, then click Forgot password.'; err.classList.add('show'); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    err.textContent = 'Password reset email sent! Check your inbox.';
    err.classList.add('show');
    err.style.color = 'var(--success)';
  } catch(e) {
    err.textContent = 'Could not send reset email. Check the address and try again.';
    err.classList.add('show');
    err.style.color = 'var(--danger)';
  }
});

// ════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Close modals with Escape key ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});

// ════════════════════════════════════════════════════════
// LOAD ALL DATA
// ════════════════════════════════════════════════════════
async function loadAll() {
  await Promise.all([
    loadNotices(),
    loadServices(),
    loadFaqs(),
    loadPolicies(),
    loadSiteConfig()
  ]);
}

async function loadSiteConfig() {
  try {
    const snap = await getDoc(doc(db, 'config', 'site'));
    siteConfig = snap.exists() ? snap.data() : {};
    // Populate settings fields
    document.getElementById('setting-announcement').value   = siteConfig.announcement || '';
    document.getElementById('setting-hours-override').value = siteConfig.hoursOverride || '';
    // Contact
    const c = siteConfig.contact || {};
    document.getElementById('setting-phone').value   = c.phone || '';
    document.getElementById('setting-email').value   = c.email || '';
    document.getElementById('setting-address').value = c.address || '';
    // EmailJS
    try {
      const ejsSnap = await getDoc(doc(db, 'config', 'emailjs'));
      if (ejsSnap.exists()) {
        const ejs = ejsSnap.data();
        document.getElementById('setting-ejs-public').value = ejs.publicKey || '';
        document.getElementById('setting-ejs-service').value = ejs.serviceId || '';
        document.getElementById('setting-ejs-template').value = ejs.templateId || '';
      }
    } catch(e) {}
    // Hours
    renderHoursForm();
    // Can redemption
    document.getElementById('can-redemption-hours').value = siteConfig.canRedemptionHours || '';
    // Headings
    loadHeadingsForm();
  } catch(e) {
    console.warn('Could not load site config:', e);
  }
}

// ════════════════════════════════════════════════════════
// NOTICES
// ════════════════════════════════════════════════════════
async function loadNotices() {
  try {
    const snap = await getDocs(collection(db, 'notices'));
    notices = [];
    snap.forEach(d => notices.push({ id: d.id, ...d.data() }));
    notices.sort((a,b) => (a.order || 0) - (b.order || 0));
    renderNotices();
  } catch(e) { toast('Could not load notices', 'error'); }
}

function renderNotices() {
  const tbody = document.getElementById('notices-tbody');
  const empty = document.getElementById('notices-empty');
  const table = document.getElementById('notices-table');
  if (!notices.length) { table.style.display = 'none'; empty.style.display = 'block'; return; }
  table.style.display = ''; empty.style.display = 'none';
  tbody.innerHTML = notices.map((n, i) => `
    <tr>
      <td>
        <button class="btn-order" ${i===0?'disabled':''} onclick="moveNotice('${n.id}',-1)">&uarr;</button>
        <button class="btn-order" ${i===notices.length-1?'disabled':''} onclick="moveNotice('${n.id}',1)">&darr;</button>
      </td>
      <td class="td-title">${esc(n.title)}</td>
      <td class="hide-mobile" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(n.body)}</td>
      <td>${n.expires || '—'}</td>
      <td class="td-actions">
        <button class="btn-edit" onclick="editNotice('${n.id}')">Edit</button>
        <button class="btn-del" onclick="delNotice('${n.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openNoticeModal(notice) {
  document.getElementById('notice-id').value     = notice ? notice.id : '';
  document.getElementById('notice-title').value   = notice ? notice.title : '';
  document.getElementById('notice-body').value    = notice ? notice.body : '';
  document.getElementById('notice-expires').value = notice ? (notice.expires || '') : '';
  document.getElementById('notice-modal-title').textContent = notice ? 'Edit Notice' : 'Add Notice';
  document.getElementById('notice-modal').classList.add('open');
}

window.openNoticeModal = () => openNoticeModal(null);
window.editNotice = (id) => { const n = notices.find(x => x.id === id); if (n) openNoticeModal(n); };
window.delNotice = async (id) => {
  if (!confirm('Delete this notice?')) return;
  try { await deleteDoc(doc(db, 'notices', id)); toast('Notice deleted', 'success'); await loadNotices(); }
  catch(e) { toast('Could not delete notice', 'error'); }
};
window.moveNotice = async (id, dir) => {
  const idx = notices.findIndex(x => x.id === id);
  if (idx < 0) return;
  const swapIdx = idx + dir;
  if (swapIdx < 0 || swapIdx >= notices.length) return;
  const a = notices[idx], b = notices[swapIdx];
  const aOrder = (a.order != null ? a.order : idx), bOrder = (b.order != null ? b.order : swapIdx);
  try {
    await Promise.all([
      updateDoc(doc(db, 'notices', a.id), { order: bOrder }),
      updateDoc(doc(db, 'notices', b.id), { order: aOrder })
    ]);
    await loadNotices();
  } catch(e) { toast('Could not reorder', 'error'); }
};

document.getElementById('notice-modal-save').addEventListener('click', async () => {
  const id      = document.getElementById('notice-id').value;
  const title   = document.getElementById('notice-title').value.trim();
  const body    = document.getElementById('notice-body').value.trim();
  const expires = document.getElementById('notice-expires').value || null;
  if (!title || !body) { alert('Title and body are required.'); return; }
  const btn = document.getElementById('notice-modal-save');
  btn.disabled = true;
  try {
    if (id) {
      await updateDoc(doc(db, 'notices', id), { title, body, expires });
    } else {
      await addDoc(collection(db, 'notices'), { title, body, expires, order: notices.length });
    }
    document.getElementById('notice-modal').classList.remove('open');
    toast(id ? 'Notice updated' : 'Notice added', 'success');
    await loadNotices();
  } catch(e) { toast('Could not save notice', 'error'); }
  btn.disabled = false;
});

// ════════════════════════════════════════════════════════
// SERVICES
// ════════════════════════════════════════════════════════
async function loadServices() {
  try {
    const snap = await getDocs(collection(db, 'services'));
    services = [];
    snap.forEach(d => services.push({ id: d.id, ...d.data() }));
    services.sort((a,b) => (a.order || 0) - (b.order || 0));
    renderServices();
  } catch(e) { toast('Could not load services', 'error'); }
}

function renderServices() {
  const tbody = document.getElementById('services-tbody');
  const empty = document.getElementById('services-empty');
  const table = document.getElementById('services-table');
  if (!services.length) { table.style.display = 'none'; empty.style.display = 'block'; return; }
  table.style.display = ''; empty.style.display = 'none';
  tbody.innerHTML = services.map((s, i) => `
    <tr>
      <td>
        <button class="btn-order" ${i===0?'disabled':''} onclick="moveService('${s.id}',-1)">&uarr;</button>
        <button class="btn-order" ${i===services.length-1?'disabled':''} onclick="moveService('${s.id}',1)">&darr;</button>
      </td>
      <td><span style="background:var(--danger-bg);color:var(--red);padding:0.15rem 0.5rem;border-radius:3px;font-size:0.78rem;font-weight:600">${esc(s.tag || '')}</span></td>
      <td class="td-title">${esc(s.name)}</td>
      <td class="td-actions">
        <button class="btn-edit" onclick="editService('${s.id}')">Edit</button>
        <button class="btn-del" onclick="delService('${s.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openServiceModal(svc) {
  document.getElementById('service-id').value       = svc ? svc.id : '';
  document.getElementById('service-tag').value       = svc ? (svc.tag || '') : '';
  document.getElementById('service-name').value      = svc ? svc.name : '';
  document.getElementById('service-desc').value      = svc ? (svc.description || '') : '';
  document.getElementById('service-details').value   = svc ? (svc.details || '') : '';
  document.getElementById('service-img-data').value  = svc ? (svc.img || '') : '';
  document.getElementById('service-img-input').value = '';
  const preview = document.getElementById('service-img-preview');
  if (svc && svc.img) { preview.src = svc.img; preview.style.display = 'block'; }
  else { preview.style.display = 'none'; }
  document.getElementById('service-modal-title').textContent = svc ? 'Edit Service' : 'Add Service';
  document.getElementById('service-modal').classList.add('open');
}

window.openServiceModal = () => openServiceModal(null);
window.editService = (id) => { const s = services.find(x => x.id === id); if (s) openServiceModal(s); };
window.delService = async (id) => {
  if (!confirm('Delete this service?')) return;
  try { await deleteDoc(doc(db, 'services', id)); toast('Service deleted', 'success'); await loadServices(); }
  catch(e) { toast('Could not delete service', 'error'); }
};
window.moveService = async (id, dir) => {
  const idx = services.findIndex(x => x.id === id);
  if (idx < 0) return;
  const swapIdx = idx + dir;
  if (swapIdx < 0 || swapIdx >= services.length) return;
  const a = services[idx], b = services[swapIdx];
  const aOrder = (a.order != null ? a.order : idx), bOrder = (b.order != null ? b.order : swapIdx);
  try {
    await Promise.all([
      updateDoc(doc(db, 'services', a.id), { order: bOrder }),
      updateDoc(doc(db, 'services', b.id), { order: aOrder })
    ]);
    await loadServices();
  } catch(e) { toast('Could not reorder', 'error'); }
};

// Service image upload handler
document.getElementById('service-img-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await resizeImage(file, 800, 0.75);
    document.getElementById('service-img-data').value = dataUrl;
    const preview = document.getElementById('service-img-preview');
    preview.src = dataUrl; preview.style.display = 'block';
  } catch(err) {
    alert(err.message);
    e.target.value = '';
  }
});

document.getElementById('service-modal-save').addEventListener('click', async () => {
  const id          = document.getElementById('service-id').value;
  const tag         = document.getElementById('service-tag').value.trim();
  const name        = document.getElementById('service-name').value.trim();
  const description = document.getElementById('service-desc').value.trim();
  const details     = document.getElementById('service-details').value.trim();
  const img         = document.getElementById('service-img-data').value;
  if (!name) { alert('Name is required.'); return; }
  const btn = document.getElementById('service-modal-save');
  btn.disabled = true;
  try {
    const data = { tag, name, description, details, img };
    if (id) {
      await updateDoc(doc(db, 'services', id), data);
    } else {
      data.order = services.length;
      await addDoc(collection(db, 'services'), data);
    }
    document.getElementById('service-modal').classList.remove('open');
    toast(id ? 'Service updated' : 'Service added', 'success');
    await loadServices();
  } catch(e) { toast('Could not save service', 'error'); }
  btn.disabled = false;
});

// ════════════════════════════════════════════════════════
// FAQ
// ════════════════════════════════════════════════════════
async function loadFaqs() {
  try {
    const snap = await getDocs(collection(db, 'faqs'));
    faqs = [];
    snap.forEach(d => faqs.push({ id: d.id, ...d.data() }));
    faqs.sort((a,b) => (a.order || 0) - (b.order || 0));
    renderFaqs();
  } catch(e) { toast('Could not load FAQs', 'error'); }
}

function renderFaqs() {
  const tbody = document.getElementById('faq-tbody');
  const empty = document.getElementById('faq-empty');
  const table = document.getElementById('faq-table');
  if (!faqs.length) { table.style.display = 'none'; empty.style.display = 'block'; return; }
  table.style.display = ''; empty.style.display = 'none';
  tbody.innerHTML = faqs.map((f, i) => `
    <tr>
      <td>
        <button class="btn-order" ${i===0?'disabled':''} onclick="moveFaq('${f.id}',-1)">&uarr;</button>
        <button class="btn-order" ${i===faqs.length-1?'disabled':''} onclick="moveFaq('${f.id}',1)">&darr;</button>
      </td>
      <td class="td-title" style="max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(truncate(f.question, 80))}</td>
      <td class="td-actions">
        <button class="btn-edit" onclick="editFaq('${f.id}')">Edit</button>
        <button class="btn-del" onclick="delFaq('${f.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openFaqModal(faq) {
  document.getElementById('faq-id').value       = faq ? faq.id : '';
  document.getElementById('faq-question').value = faq ? faq.question : '';
  document.getElementById('faq-answer').value   = faq ? faq.answer : '';
  document.getElementById('faq-modal-title').textContent = faq ? 'Edit FAQ' : 'Add FAQ';
  document.getElementById('faq-modal').classList.add('open');
}

window.openFaqModal = () => openFaqModal(null);
window.editFaq = (id) => { const f = faqs.find(x => x.id === id); if (f) openFaqModal(f); };
window.delFaq = async (id) => {
  if (!confirm('Delete this FAQ?')) return;
  try { await deleteDoc(doc(db, 'faqs', id)); toast('FAQ deleted', 'success'); await loadFaqs(); }
  catch(e) { toast('Could not delete FAQ', 'error'); }
};
window.moveFaq = async (id, dir) => {
  const idx = faqs.findIndex(x => x.id === id);
  if (idx < 0) return;
  const swapIdx = idx + dir;
  if (swapIdx < 0 || swapIdx >= faqs.length) return;
  const a = faqs[idx], b = faqs[swapIdx];
  const aOrder = (a.order != null ? a.order : idx), bOrder = (b.order != null ? b.order : swapIdx);
  try {
    await Promise.all([
      updateDoc(doc(db, 'faqs', a.id), { order: bOrder }),
      updateDoc(doc(db, 'faqs', b.id), { order: aOrder })
    ]);
    await loadFaqs();
  } catch(e) { toast('Could not reorder', 'error'); }
};

document.getElementById('faq-modal-save').addEventListener('click', async () => {
  const id       = document.getElementById('faq-id').value;
  const question = document.getElementById('faq-question').value.trim();
  const answer   = document.getElementById('faq-answer').value.trim();
  if (!question || !answer) { alert('Question and answer are required.'); return; }
  const btn = document.getElementById('faq-modal-save');
  btn.disabled = true;
  try {
    if (id) {
      await updateDoc(doc(db, 'faqs', id), { question, answer });
    } else {
      await addDoc(collection(db, 'faqs'), { question, answer, order: faqs.length });
    }
    document.getElementById('faq-modal').classList.remove('open');
    toast(id ? 'FAQ updated' : 'FAQ added', 'success');
    await loadFaqs();
  } catch(e) { toast('Could not save FAQ', 'error'); }
  btn.disabled = false;
});

// ════════════════════════════════════════════════════════
// POLICIES
// ════════════════════════════════════════════════════════
async function loadPolicies() {
  try {
    const snap = await getDocs(collection(db, 'policies'));
    policies = [];
    snap.forEach(d => policies.push({ id: d.id, ...d.data() }));
    policies.sort((a,b) => (a.order || 0) - (b.order || 0));
    renderPolicies();
  } catch(e) { toast('Could not load policies', 'error'); }
}

function renderPolicies() {
  const tbody = document.getElementById('policies-tbody');
  const empty = document.getElementById('policies-empty');
  const table = document.getElementById('policies-table');
  if (!policies.length) { table.style.display = 'none'; empty.style.display = 'block'; return; }
  table.style.display = ''; empty.style.display = 'none';
  tbody.innerHTML = policies.map((p, i) => `
    <tr>
      <td>
        <button class="btn-order" ${i===0?'disabled':''} onclick="movePolicy('${p.id}',-1)">&uarr;</button>
        <button class="btn-order" ${i===policies.length-1?'disabled':''} onclick="movePolicy('${p.id}',1)">&darr;</button>
      </td>
      <td class="td-title">${esc(p.title)}</td>
      <td class="td-actions">
        <button class="btn-edit" onclick="editPolicy('${p.id}')">Edit</button>
        <button class="btn-del" onclick="delPolicy('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openPolicyModal(pol) {
  document.getElementById('policy-id').value    = pol ? pol.id : '';
  document.getElementById('policy-title').value = pol ? pol.title : '';
  document.getElementById('policy-body').value  = pol ? pol.body : '';
  document.getElementById('policy-modal-title').textContent = pol ? 'Edit Policy' : 'Add Policy';
  document.getElementById('policy-modal').classList.add('open');
}

window.openPolicyModal = () => openPolicyModal(null);
window.editPolicy = (id) => { const p = policies.find(x => x.id === id); if (p) openPolicyModal(p); };
window.delPolicy = async (id) => {
  if (!confirm('Delete this policy?')) return;
  try { await deleteDoc(doc(db, 'policies', id)); toast('Policy deleted', 'success'); await loadPolicies(); }
  catch(e) { toast('Could not delete policy', 'error'); }
};
window.movePolicy = async (id, dir) => {
  const idx = policies.findIndex(x => x.id === id);
  if (idx < 0) return;
  const swapIdx = idx + dir;
  if (swapIdx < 0 || swapIdx >= policies.length) return;
  const a = policies[idx], b = policies[swapIdx];
  const aOrder = (a.order != null ? a.order : idx), bOrder = (b.order != null ? b.order : swapIdx);
  try {
    await Promise.all([
      updateDoc(doc(db, 'policies', a.id), { order: bOrder }),
      updateDoc(doc(db, 'policies', b.id), { order: aOrder })
    ]);
    await loadPolicies();
  } catch(e) { toast('Could not reorder', 'error'); }
};

document.getElementById('policy-modal-save').addEventListener('click', async () => {
  const id    = document.getElementById('policy-id').value;
  const title = document.getElementById('policy-title').value.trim();
  const body  = document.getElementById('policy-body').value.trim();
  if (!title || !body) { alert('Title and body are required.'); return; }
  const btn = document.getElementById('policy-modal-save');
  btn.disabled = true;
  try {
    if (id) {
      await updateDoc(doc(db, 'policies', id), { title, body });
    } else {
      await addDoc(collection(db, 'policies'), { title, body, order: policies.length });
    }
    document.getElementById('policy-modal').classList.remove('open');
    toast(id ? 'Policy updated' : 'Policy added', 'success');
    await loadPolicies();
  } catch(e) { toast('Could not save policy', 'error'); }
  btn.disabled = false;
});

// ════════════════════════════════════════════════════════
// HOURS
// ════════════════════════════════════════════════════════
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function renderHoursForm() {
  const grid = document.getElementById('office-hours-grid');
  const hours = siteConfig.hours || {};
  grid.innerHTML = DAYS.map((day, i) => {
    const d = hours[day] || { open: true, from: '7:00 AM', to: '5:00 PM' };
    const isOpen = d.open !== false;
    const fromVal = to24h(d.from);
    const toVal = to24h(d.to);
    return `
      <div class="hours-row">
        <label>${DAY_LABELS[i]}</label>
        <label class="toggle">
          <input type="checkbox" data-day="${day}" data-field="open" ${isOpen ? 'checked' : ''}/>
          <span class="slider"></span>
        </label>
        <input type="time" data-day="${day}" data-field="from" value="${fromVal}"/>
        <span style="text-align:center;color:var(--text-light);font-size:0.85rem">to</span>
        <input type="time" data-day="${day}" data-field="to" value="${toVal}"/>
      </div>
    `;
  }).join('');
}

window.saveHours = async () => {
  const hours = {};
  DAYS.forEach(day => {
    const openEl = document.querySelector(`input[data-day="${day}"][data-field="open"]`);
    const fromEl = document.querySelector(`input[data-day="${day}"][data-field="from"]`);
    const toEl   = document.querySelector(`input[data-day="${day}"][data-field="to"]`);
    hours[day] = {
      open: openEl.checked,
      from: to12h(fromEl.value),
      to: to12h(toEl.value)
    };
  });
  const canRedemptionHours = document.getElementById('can-redemption-hours').value.trim();
  try {
    await setDoc(doc(db, 'config', 'site'), { hours, canRedemptionHours }, { merge: true });
    siteConfig.hours = hours;
    siteConfig.canRedemptionHours = canRedemptionHours;
    toast('Hours saved', 'success');
  } catch(e) { toast('Could not save hours', 'error'); }
};

// ════════════════════════════════════════════════════════
// IMAGES
// ════════════════════════════════════════════════════════
const IMAGE_IDS = [
  { id: 'hero', label: 'Hero' },
  { id: 'logo', label: 'Logo' },
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'recycling', label: 'Recycling' },
  { id: 'can-redemption', label: 'Can Redemption' },
  { id: 'portable-toilet', label: 'Portable Toilet' },
  { id: 'dumpster-rolloff', label: 'Dumpster / Roll-off' },
  { id: 'promo-flyer', label: 'Promo Flyer' }
];

let currentImageTarget = null;

async function loadImages() {
  const grid = document.getElementById('images-grid');
  grid.innerHTML = IMAGE_IDS.map(img => `
    <div class="img-card" id="img-card-${img.id}">
      <img class="img-preview" id="img-preview-${img.id}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='150'%3E%3Crect fill='%23E0DCDA' width='220' height='150'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23888' font-family='sans-serif' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E" alt="${esc(img.label)}"/>
      <div class="img-body">
        <div class="img-label">${esc(img.label)}</div>
        <div class="img-actions">
          <button class="btn-change" onclick="changeImage('${img.id}')">Change Photo</button>
          <button class="btn-reset" onclick="resetImage('${img.id}')">Reset</button>
        </div>
      </div>
    </div>
  `).join('');

  // Load current images from Firestore
  for (const img of IMAGE_IDS) {
    try {
      const snap = await getDoc(doc(db, 'siteImages', img.id));
      if (snap.exists() && snap.data().img) {
        document.getElementById(`img-preview-${img.id}`).src = snap.data().img;
      }
    } catch(e) { /* ignore individual failures */ }
  }
}

window.changeImage = (imgId) => {
  currentImageTarget = imgId;
  document.getElementById('img-file-input').click();
};

document.getElementById('img-file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || !currentImageTarget) return;
  try {
    const dataUrl = await resizeImage(file, 800, 0.75);
    await setDoc(doc(db, 'siteImages', currentImageTarget), { img: dataUrl });
    document.getElementById(`img-preview-${currentImageTarget}`).src = dataUrl;
    toast('Image updated', 'success');
  } catch(err) {
    toast(err.message || 'Could not upload image', 'error');
  }
  e.target.value = '';
  currentImageTarget = null;
});

window.resetImage = async (imgId) => {
  var found = IMAGE_IDS.find(function(i){ return i.id === imgId; });
  if (!confirm('Reset "' + (found ? found.label : imgId) + '" to default?')) return;
  try {
    await deleteDoc(doc(db, 'siteImages', imgId));
    document.getElementById(`img-preview-${imgId}`).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='150'%3E%3Crect fill='%23E0DCDA' width='220' height='150'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23888' font-family='sans-serif' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E";
    toast('Image reset to default', 'success');
  } catch(e) { toast('Could not reset image', 'error'); }
};

// Load images when Images tab is first clicked
let imagesLoaded = false;
document.querySelector('[data-tab="images"]').addEventListener('click', () => {
  if (!imagesLoaded) { imagesLoaded = true; loadImages(); }
});

// ════════════════════════════════════════════════════════
// HEADINGS
// ════════════════════════════════════════════════════════
function loadHeadingsForm() {
  const headings = siteConfig.headings || {};
  document.querySelectorAll('[data-heading]').forEach(el => {
    const key = el.dataset.heading;
    el.value = headings[key] || '';
  });
}

window.saveHeadings = async () => {
  const headings = {};
  document.querySelectorAll('[data-heading]').forEach(el => {
    headings[el.dataset.heading] = el.value.trim();
  });
  try {
    await setDoc(doc(db, 'config', 'site'), { headings }, { merge: true });
    siteConfig.headings = headings;
    toast('Headings saved', 'success');
  } catch(e) { toast('Could not save headings', 'error'); }
};

// ════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════
window.saveAnnouncement = async () => {
  const val = document.getElementById('setting-announcement').value.trim();
  try {
    await setDoc(doc(db, 'config', 'site'), { announcement: val }, { merge: true });
    siteConfig.announcement = val;
    toast('Announcement saved', 'success');
  } catch(e) { toast('Could not save', 'error'); }
};

window.saveHoursOverride = async () => {
  const val = document.getElementById('setting-hours-override').value.trim();
  try {
    await setDoc(doc(db, 'config', 'site'), { hoursOverride: val }, { merge: true });
    siteConfig.hoursOverride = val;
    toast('Hours override saved', 'success');
  } catch(e) { toast('Could not save', 'error'); }
};

window.saveContact = async () => {
  const contact = {
    phone:   document.getElementById('setting-phone').value.trim(),
    email:   document.getElementById('setting-email').value.trim(),
    address: document.getElementById('setting-address').value.trim()
  };
  try {
    await setDoc(doc(db, 'config', 'site'), { contact }, { merge: true });
    siteConfig.contact = contact;
    toast('Contact info saved', 'success');
  } catch(e) { toast('Could not save contact info', 'error'); }
};

window.saveEmailJS = async () => {
  const data = {
    publicKey:  document.getElementById('setting-ejs-public').value.trim(),
    serviceId:  document.getElementById('setting-ejs-service').value.trim(),
    templateId: document.getElementById('setting-ejs-template').value.trim()
  };
  if (!data.publicKey || !data.serviceId || !data.templateId) { toast('All 3 fields are required', 'error'); return; }
  try {
    await setDoc(doc(db, 'config', 'emailjs'), data);
    toast('EmailJS config saved — contact form is live!', 'success');
  } catch(e) { toast('Could not save EmailJS config', 'error'); }
};

window.exportBackup = async () => {
  try {
    const [noticesSnap, servicesSnap, faqsSnap, policiesSnap, configSnap, imagesSnaps] = await Promise.all([
      getDocs(collection(db, 'notices')),
      getDocs(collection(db, 'services')),
      getDocs(collection(db, 'faqs')),
      getDocs(collection(db, 'policies')),
      getDoc(doc(db, 'config', 'site')),
      getDocs(collection(db, 'siteImages'))
    ]);
    const data = {
      exportedAt: new Date().toISOString(),
      notices: [],
      services: [],
      faqs: [],
      policies: [],
      siteImages: [],
      config: configSnap.exists() ? configSnap.data() : {}
    };
    noticesSnap.forEach(d  => data.notices.push({ id: d.id, ...d.data() }));
    servicesSnap.forEach(d => data.services.push({ id: d.id, ...d.data() }));
    faqsSnap.forEach(d     => data.faqs.push({ id: d.id, ...d.data() }));
    policiesSnap.forEach(d => data.policies.push({ id: d.id, ...d.data() }));
    imagesSnaps.forEach(d  => data.siteImages.push({ id: d.id, ...d.data() }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `dennys-sanitation-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('Backup downloaded', 'success');
  } catch(e) { toast('Could not export', 'error'); }
};

