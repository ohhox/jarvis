import { api, setToken, getToken, clearToken, fmtDateTime } from '/shared/api.js';

const TOKEN_KEY = 'student_token';
const views = ['loading', 'mocklogin', 'register', 'status', 'checkin'];
function show(view) {
  for (const v of views) {
    document.getElementById(`view-${v}`).classList.toggle('hidden', v !== view);
  }
}

let lineProfile = null;

async function boot() {
  // returning user: มี token เดิมที่ยังไม่หมดอายุ → เข้าใช้งานต่อได้เลย
  if (getToken(TOKEN_KEY)) {
    try {
      const me = await api('/students/me', { tokenKey: TOKEN_KEY });
      if (me.registered) return routeStudent(me.student);
      return enterRegister();
    } catch {
      clearToken(TOKEN_KEY); // token หมดอายุ/ไม่ถูกต้อง → login ใหม่
    }
  }

  let cfg;
  try {
    cfg = await api('/auth/config');
  } catch {
    cfg = { mockMode: true, liffId: '' };
  }

  if (cfg.mockMode || !cfg.liffId) {
    // โหมดทดสอบ: ให้กรอก mock user
    setupMockLogin();
    show('mocklogin');
    return;
  }

  // โหมด LINE จริง
  try {
    await liff.init({ liffId: cfg.liffId });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }
    const idToken = liff.getIDToken();
    const res = await api('/auth/line', { method: 'POST', body: { idToken } });
    onAuthed(res);
  } catch (err) {
    // ถ้า LIFF ล้มเหลว fallback ไป mock
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
    if (!userId) {
      errEl.textContent = 'กรุณากรอก LINE User ID';
      return;
    }
    try {
      const res = await api('/auth/line', {
        method: 'POST',
        body: { mockUserId: userId, mockName: name },
      });
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
    routeStudent(res.student);
  } else {
    enterRegister();
  }
}

// ตัดสินใจว่าจะไปหน้าไหนตามสถานะการอนุมัติ
function routeStudent(student) {
  if (student.status === 'approved') enterCheckin(student);
  else enterStatus(student);
}

function enterStatus(student) {
  const rejected = student.status === 'rejected';
  document.getElementById('status-emoji').textContent = rejected ? '❌' : '⏳';
  document.getElementById('status-title').textContent = rejected
    ? 'ข้อมูลไม่ถูกต้อง'
    : 'รอครูตรวจสอบ';
  const box = document.getElementById('status-box');
  box.className = 'status ' + (rejected ? 'bad' : 'info');
  box.textContent = rejected
    ? (student.review_note
        ? `ครูแจ้งว่า: ${student.review_note} — กรุณาแก้ไขข้อมูลให้ถูกต้อง`
        : 'ครูตรวจแล้วพบว่าข้อมูลไม่ถูกต้อง — กรุณาแก้ไขข้อมูล')
    : 'ข้อมูลของคุณถูกส่งให้ครูตรวจสอบแล้ว เมื่อครูอนุมัติจึงจะเช็คอินได้';
  document.getElementById('status-data').innerHTML = `
    <div class="muted" style="font-size:13px">ข้อมูลที่ลงทะเบียนไว้</div>
    <div><strong>${student.full_name}</strong></div>
    <div>${student.class_room || '-'} · เลขที่ ${student.student_code}</div>`;
  document.getElementById('btn-status-edit').onclick = () => enterRegister(student);
  show('status');
}

function enterRegister(prefill) {
  document.getElementById('register-hello').textContent = lineProfile
    ? `สวัสดี ${lineProfile.displayName} — กรอกข้อมูลของนักเรียนเพื่อเริ่มใช้งาน`
    : 'กรอกข้อมูลของนักเรียนเพื่อเริ่มใช้งาน';
  if (prefill) {
    document.getElementById('reg-code').value = prefill.student_code || '';
    document.getElementById('reg-name').value = prefill.full_name || '';
    document.getElementById('reg-class').value = prefill.class_room || '';
    document.getElementById('reg-phone').value = prefill.phone || '';
    document.getElementById('reg-guardian').value = prefill.guardian_phone || '';
  }
  document.getElementById('btn-register').onclick = submitRegister;
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
    errEl.textContent = 'กรุณากรอกเลขประจำตัวและชื่อ-สกุล';
    return;
  }
  try {
    const res = await api('/students/register', {
      method: 'POST',
      body,
      tokenKey: TOKEN_KEY,
    });
    setToken(TOKEN_KEY, res.token);
    routeStudent(res.student);
  } catch (err) {
    errEl.textContent = err.message;
  }
}

function enterCheckin(student) {
  document.getElementById('checkin-hello').textContent =
    `${student.full_name} · ${student.class_room || '-'} · เลขที่ ${student.student_code}`;
  document.getElementById('btn-checkin').onclick = doCheckin;
  document.getElementById('btn-editprofile').onclick = () => enterRegister(student);
  document.getElementById('checkin-result').innerHTML = '';
  loadHistory();
  show('checkin');
}

function doCheckin() {
  const btn = document.getElementById('btn-checkin');
  const errEl = document.getElementById('checkin-err');
  const resultEl = document.getElementById('checkin-result');
  errEl.textContent = '';
  resultEl.innerHTML = '';

  if (!navigator.geolocation) {
    errEl.textContent = 'อุปกรณ์ไม่รองรับการระบุตำแหน่ง';
    return;
  }

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
      errEl.textContent =
        geoErr.code === geoErr.PERMISSION_DENIED
          ? 'กรุณาอนุญาตให้เข้าถึงตำแหน่ง แล้วลองใหม่'
          : 'ระบุตำแหน่งไม่สำเร็จ ลองใหม่อีกครั้ง';
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
}

function renderResult(res) {
  const el = document.getElementById('checkin-result');
  if (res.ok) {
    el.innerHTML = `
      <div class="status ok">
        <div class="big-emoji">✅</div>
        <div>${res.message}</div>
        <div class="muted" style="margin-top:6px">ห่างจากจุดศูนย์กลาง ${res.distance_m} ม.</div>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="status bad">
        <div class="big-emoji">🚫</div>
        <div>${res.message}</div>
        <div class="muted" style="margin-top:6px">ต้องเข้าไปในพื้นที่ที่ครูกำหนดก่อน</div>
      </div>`;
  }
}

async function loadHistory() {
  try {
    const { checkins } = await api('/checkin/mine', { tokenKey: TOKEN_KEY });
    const el = document.getElementById('history');
    if (!checkins.length) {
      el.innerHTML = '<p class="muted">ยังไม่มีประวัติ</p>';
      return;
    }
    el.innerHTML = checkins
      .map((c) => {
        const pill =
          c.status === 'in_range'
            ? '<span class="pill green">ผ่าน</span>'
            : '<span class="pill red">นอกพื้นที่</span>';
        return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span>${fmtDateTime(c.checked_at)}</span>
          <span>${pill} <span class="muted">${c.distance_m} ม.</span></span>
        </div>`;
      })
      .join('');
  } catch {
    /* ignore */
  }
}

boot();
