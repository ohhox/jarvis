import { api, setToken, getToken, clearToken, fmtDateTime } from '/shared/api.js';

const TOKEN_KEY = 'student_token';
const preViews = ['loading', 'mocklogin', 'register', 'status'];
let lineProfile = null;
let currentStudent = null;

function show(view) {
  for (const v of preViews) {
    document.getElementById(`view-${v}`).classList.toggle('hidden', v !== view);
  }
  const isApp = view === 'app';
  document.getElementById('view-app').classList.toggle('hidden', !isApp);
  document.getElementById('bottom-nav').classList.toggle('hidden', !isApp);
  document.getElementById('app-wrap').classList.toggle('has-bottom-nav', isApp);
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
function fmtDate(d) {
  if (!d) return '-';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { dateStyle: 'medium' });
  } catch { return d; }
}
const STATUS_PILL = {
  pending: '<span class="pill gray">รอตรวจสอบ</span>',
  approved: '<span class="pill green">อนุมัติแล้ว</span>',
  rejected: '<span class="pill red">ไม่อนุมัติ</span>',
};
const LEAVE_LABEL = { sick: 'ลาป่วย', personal: 'ลากิจ' };

// ===== Auth / boot =====
async function boot() {
  if (getToken(TOKEN_KEY)) {
    try {
      const me = await api('/students/me', { tokenKey: TOKEN_KEY });
      if (me.registered) return routeStudent(me.student);
      return enterRegister();
    } catch {
      clearToken(TOKEN_KEY);
    }
  }

  let cfg;
  try {
    cfg = await api('/auth/config');
  } catch {
    cfg = { mockMode: true, liffId: '' };
  }

  if (cfg.mockMode || !cfg.liffId) {
    setupMockLogin();
    show('mocklogin');
    return;
  }

  try {
    await liff.init({ liffId: cfg.liffId });
    if (!liff.isLoggedIn()) { liff.login(); return; }
    const idToken = liff.getIDToken();
    const res = await api('/auth/line', { method: 'POST', body: { idToken } });
    onAuthed(res);
  } catch (err) {
    console.error('LIFF init failed', err);
    setupMockLogin();
    show('mocklogin');
  }
}

function setupMockLogin() {
  document.getElementById('btn-mocklogin').onclick = async () => {
    const userId = document.getElementById('mock-userid').value.trim();
    const name = document.getElementById('mock-name').value.trim();
    const errEl = document.getElementById('mock-err');
    errEl.textContent = '';
    if (!userId) return (errEl.textContent = 'กรุณากรอก LINE User ID');
    try {
      const res = await api('/auth/line', { method: 'POST', body: { mockUserId: userId, mockName: name } });
      onAuthed(res);
    } catch (err) {
      errEl.textContent = err.message;
    }
  };
}

function onAuthed(res) {
  setToken(TOKEN_KEY, res.token);
  lineProfile = res.lineProfile;
  if (res.registered) {
    currentStudent = res.student;
    routeStudent(res.student);
  } else {
    currentStudent = null;
    enterRegister();
  }
}

function routeStudent(student) {
  currentStudent = student;
  if (student.status === 'approved') enterApp(student);
  else enterStatus(student);
}

// ===== Register =====
function enterRegister(prefill) {
  document.getElementById('register-hello').textContent = lineProfile
    ? `สวัสดี ${lineProfile.displayName} — กรอกข้อมูลของนักเรียน`
    : 'กรอกข้อมูลของนักเรียน';
  const p = prefill || currentStudent;
  document.getElementById('reg-code').value = p?.student_code || '';
  document.getElementById('reg-name').value = p?.full_name || '';
  document.getElementById('reg-class').value = p?.class_room || '';
  document.getElementById('reg-phone').value = p?.phone || '';
  document.getElementById('reg-guardian').value = p?.guardian_phone || '';
  document.getElementById('reg-err').textContent = '';
  // มีบัญชีอยู่แล้ว = โหมดแก้ไข → มีปุ่มยกเลิก
  document.getElementById('btn-register-back').classList.toggle('hidden', !currentStudent);
  document.getElementById('btn-register').onclick = submitRegister;
  document.getElementById('btn-register-back').onclick = () => routeStudent(currentStudent);
  show('register');
}

async function submitRegister() {
  const errEl = document.getElementById('reg-err');
  errEl.textContent = '';
  const body = {
    student_code: document.getElementById('reg-code').value.trim(),
    full_name: document.getElementById('reg-name').value.trim(),
    class_room: document.getElementById('reg-class').value.trim(),
    phone: document.getElementById('reg-phone').value.trim(),
    guardian_phone: document.getElementById('reg-guardian').value.trim(),
  };
  if (!body.student_code || !body.full_name) {
    return (errEl.textContent = 'กรุณากรอกเลขประจำตัวและชื่อ-สกุล');
  }
  try {
    const res = await api('/students/register', { method: 'POST', body, tokenKey: TOKEN_KEY });
    setToken(TOKEN_KEY, res.token);
    routeStudent(res.student);
  } catch (err) {
    errEl.textContent = err.message;
  }
}

// ===== Status (รอ/ปฏิเสธ) =====
function enterStatus(student) {
  const rejected = student.status === 'rejected';
  document.getElementById('status-emoji').textContent = rejected ? '❌' : '⏳';
  document.getElementById('status-title').textContent = rejected ? 'ข้อมูลไม่ถูกต้อง' : 'รอครูตรวจสอบ';
  const box = document.getElementById('status-box');
  box.className = 'status ' + (rejected ? 'bad' : 'info');
  box.textContent = rejected
    ? (student.review_note
        ? `ครูแจ้งว่า: ${student.review_note} — กรุณาแก้ไขข้อมูลให้ถูกต้อง`
        : 'ครูตรวจแล้วพบว่าข้อมูลไม่ถูกต้อง — กรุณาแก้ไขข้อมูล')
    : 'ข้อมูลของคุณถูกส่งให้ครูตรวจสอบแล้ว เมื่อครูอนุมัติจึงจะเช็คอินได้';
  document.getElementById('status-data').innerHTML = `
    <div class="muted" style="font-size:13px">ข้อมูลที่ลงทะเบียนไว้</div>
    <div><strong>${esc(student.full_name)}</strong></div>
    <div>${esc(student.class_room) || '-'} · เลขที่ ${esc(student.student_code)}</div>`;
  document.getElementById('btn-status-edit').onclick = () => enterRegister(student);
  show('status');
}

// ===== Main app / tabs =====
function enterApp(student) {
  currentStudent = student;
  document.getElementById('checkin-hello').textContent =
    `${student.full_name} · ${student.class_room || '-'} · เลขที่ ${student.student_code}`;
  show('app');
  switchTab('checkin');
}

const TABS = ['checkin', 'news', 'leave', 'account'];
function switchTab(name) {
  for (const t of TABS) {
    document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== name);
  }
  document.querySelectorAll('#bottom-nav button').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  window.scrollTo({ top: 0 });
  if (name === 'checkin') loadHistory();
  if (name === 'news') loadNews();
  if (name === 'leave') loadLeaves();
  if (name === 'account') renderAccount();
}
document.querySelectorAll('#bottom-nav button').forEach((b) => {
  b.onclick = () => switchTab(b.dataset.tab);
});

// ===== เช็คอิน =====
document.getElementById('btn-checkin').onclick = doCheckin;
function doCheckin() {
  const btn = document.getElementById('btn-checkin');
  const errEl = document.getElementById('checkin-err');
  const resultEl = document.getElementById('checkin-result');
  errEl.textContent = '';
  resultEl.innerHTML = '';
  if (!navigator.geolocation) return (errEl.textContent = 'อุปกรณ์ไม่รองรับการระบุตำแหน่ง');

  btn.disabled = true;
  btn.textContent = 'กำลังหาตำแหน่ง...';
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const res = await api('/checkin', {
          method: 'POST',
          body: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          tokenKey: TOKEN_KEY,
        });
        renderResult(res);
        loadHistory();
      } catch (err) {
        errEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = '📍 เช็คอินตำแหน่งปัจจุบัน';
      }
    },
    (geoErr) => {
      btn.disabled = false;
      btn.textContent = '📍 เช็คอินตำแหน่งปัจจุบัน';
      errEl.textContent = geoErr.code === geoErr.PERMISSION_DENIED
        ? 'กรุณาอนุญาตให้เข้าถึงตำแหน่ง แล้วลองใหม่'
        : 'ระบุตำแหน่งไม่สำเร็จ ลองใหม่อีกครั้ง';
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
}

function renderResult(res) {
  const el = document.getElementById('checkin-result');
  el.innerHTML = res.ok
    ? `<div class="status ok"><div class="big-emoji">✅</div><div>${esc(res.message)}</div>
        <div class="muted" style="margin-top:6px">ห่างจากจุดศูนย์กลาง ${res.distance_m} ม.</div></div>`
    : `<div class="status bad"><div class="big-emoji">🚫</div><div>${esc(res.message)}</div>
        <div class="muted" style="margin-top:6px">ต้องเข้าไปในพื้นที่ที่ครูกำหนดก่อน</div></div>`;
}

async function loadHistory() {
  try {
    const { checkins } = await api('/checkin/mine', { tokenKey: TOKEN_KEY });
    const el = document.getElementById('history');
    if (!checkins.length) { el.innerHTML = '<p class="muted">ยังไม่มีประวัติ</p>'; return; }
    el.innerHTML = checkins.map((c) => {
      const pill = c.status === 'in_range'
        ? '<span class="pill green">ผ่าน</span>'
        : '<span class="pill red">นอกพื้นที่</span>';
      return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <span>${fmtDateTime(c.checked_at)}</span>
        <span>${pill} <span class="muted">${c.distance_m} ม.</span></span></div>`;
    }).join('');
  } catch { /* ignore */ }
}

// ===== ข่าว =====
async function loadNews() {
  try {
    const { news } = await api('/news', { tokenKey: TOKEN_KEY });
    const el = document.getElementById('news-list');
    if (!news.length) { el.innerHTML = '<div class="card"><p class="muted">ยังไม่มีข่าว</p></div>'; return; }
    el.innerHTML = news.map((n) => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
          <h2 style="margin:0">${n.pinned ? '📌 ' : ''}${esc(n.title)}</h2>
          <span class="muted" style="font-size:12px;white-space:nowrap">${fmtDateTime(n.created_at)}</span>
        </div>
        ${n.body ? `<p style="margin:8px 0 0;white-space:pre-wrap">${esc(n.body)}</p>` : ''}
      </div>`).join('');
  } catch { /* ignore */ }
}

// ===== แจ้งลา =====
document.getElementById('btn-leave').onclick = submitLeave;
async function submitLeave() {
  const errEl = document.getElementById('leave-err');
  errEl.textContent = '';
  const body = {
    leave_type: document.getElementById('leave-type').value,
    date_from: document.getElementById('leave-from').value,
    date_to: document.getElementById('leave-to').value || document.getElementById('leave-from').value,
    reason: document.getElementById('leave-reason').value.trim(),
  };
  if (!body.date_from) return (errEl.textContent = 'กรุณาเลือกวันที่ลา');
  try {
    await api('/leaves', { method: 'POST', body, tokenKey: TOKEN_KEY });
    document.getElementById('leave-reason').value = '';
    document.getElementById('leave-from').value = '';
    document.getElementById('leave-to').value = '';
    loadLeaves();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function loadLeaves() {
  try {
    const { leaves } = await api('/leaves/mine', { tokenKey: TOKEN_KEY });
    const el = document.getElementById('leave-list');
    if (!leaves.length) { el.innerHTML = '<p class="muted">ยังไม่มีคำขอลา</p>'; return; }
    el.innerHTML = leaves.map((l) => {
      const range = l.date_to !== l.date_from ? `${fmtDate(l.date_from)} – ${fmtDate(l.date_to)}` : fmtDate(l.date_from);
      const note = l.status === 'rejected' && l.review_note
        ? `<div class="muted" style="color:var(--red)">เหตุผล: ${esc(l.review_note)}</div>` : '';
      return `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between">
          <strong>${LEAVE_LABEL[l.leave_type] || l.leave_type}</strong> ${STATUS_PILL[l.status]}
        </div>
        <div class="muted">${range}</div>
        ${l.reason ? `<div>${esc(l.reason)}</div>` : ''}${note}
      </div>`;
    }).join('');
  } catch { /* ignore */ }
}

// ===== บัญชี =====
function renderAccount() {
  const s = currentStudent;
  if (!s) return;
  document.getElementById('account-info').innerHTML = `
    <div style="margin:12px 0">
      <div style="font-size:20px;font-weight:800">${esc(s.full_name)} ${STATUS_PILL[s.status]}</div>
      <div class="muted">${esc(s.class_room) || '-'} · เลขที่ ${esc(s.student_code)}</div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:12px">
      <div style="padding:6px 0">📱 เบอร์นักเรียน: ${esc(s.phone) || '-'}</div>
      <div style="padding:6px 0">👨‍👩‍👧 เบอร์ผู้ปกครอง: ${esc(s.guardian_phone) || '-'}</div>
    </div>`;
  document.getElementById('btn-account-edit').onclick = () => enterRegister(s);
  document.getElementById('btn-logout').onclick = () => {
    clearToken(TOKEN_KEY);
    currentStudent = null;
    location.reload();
  };
}

boot();
