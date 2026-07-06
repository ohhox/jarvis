import { api, setToken, getToken, clearToken, fmtDateTime } from '/shared/api.js';

const TOKEN_KEY = 'teacher_token';

function show(view) {
  document.getElementById('view-login').classList.toggle('hidden', view !== 'login');
  document.getElementById('view-dash').classList.toggle('hidden', view !== 'dash');
}

// ===== Auth =====
document.getElementById('btn-login').onclick = login;
document.getElementById('login-pass').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});

async function login() {
  const errEl = document.getElementById('login-err');
  errEl.textContent = '';
  try {
    const res = await api('/auth/teacher/login', {
      method: 'POST',
      body: {
        username: document.getElementById('login-user').value.trim(),
        password: document.getElementById('login-pass').value,
      },
    });
    setToken(TOKEN_KEY, res.token);
    document.getElementById('dash-teacher').textContent = res.teacher.full_name || res.teacher.username;
    enterDash();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

document.getElementById('btn-logout').onclick = () => {
  clearToken(TOKEN_KEY);
  show('login');
};

// ===== Tabs =====
document.getElementById('tab-report').onclick = () => switchPanel('report');
document.getElementById('tab-zones').onclick = () => switchPanel('zones');

function switchPanel(name) {
  document.getElementById('panel-report').classList.toggle('hidden', name !== 'report');
  document.getElementById('panel-zones').classList.toggle('hidden', name !== 'zones');
  document.getElementById('tab-report').classList.toggle('secondary', name !== 'report');
  document.getElementById('tab-zones').classList.toggle('secondary', name !== 'zones');
  if (name === 'report') loadReport();
  if (name === 'zones') {
    initMap();
    loadZones();
    setTimeout(() => map && map.invalidateSize(), 50);
  }
}

function enterDash() {
  show('dash');
  const dateEl = document.getElementById('report-date');
  dateEl.value = new Date().toISOString().slice(0, 10);
  dateEl.onchange = loadReport;
  // แผนที่ถูก init แบบ lazy ตอนเปิดแท็บ "พื้นที่เช็คอิน" เพื่อไม่ให้บล็อกรายงาน
  switchPanel('report');
}

// ===== Report =====
async function loadReport() {
  const date = document.getElementById('report-date').value;
  try {
    const { summary, rows } = await api(`/reports/daily?date=${date}`, { tokenKey: TOKEN_KEY });
    document.getElementById('report-stats').innerHTML = `
      <div class="card stat"><div class="n">${summary.total_students}</div><div class="l">นักเรียนทั้งหมด</div></div>
      <div class="card stat"><div class="n" style="color:var(--green)">${summary.checked_in}</div><div class="l">เช็คอินผ่าน</div></div>
      <div class="card stat"><div class="n" style="color:var(--red)">${summary.out_of_range}</div><div class="l">นอกพื้นที่</div></div>
      <div class="card stat"><div class="n" style="color:var(--muted)">${summary.not_checked_in}</div><div class="l">ยังไม่เช็คอิน</div></div>`;

    const tbody = document.querySelector('#report-table tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="muted">ยังไม่มีนักเรียนลงทะเบียน</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map((r) => {
        let pill = '<span class="pill gray">ยังไม่เช็คอิน</span>';
        if (r.status === 'in_range') pill = '<span class="pill green">ผ่าน</span>';
        else if (r.status === 'out_of_range') pill = '<span class="pill red">นอกพื้นที่</span>';
        const dist = r.distance_m != null ? `${r.distance_m} ม.` : '-';
        return `<tr>
          <td>${r.student_code}</td>
          <td>${r.full_name}</td>
          <td>${r.class_room || '-'}</td>
          <td>${pill}</td>
          <td>${fmtDateTime(r.checked_at)}</td>
          <td>${dist}</td>
          <td>${r.guardian_phone || '-'}</td>
        </tr>`;
      })
      .join('');
  } catch (err) {
    if (String(err.message).includes('unauthorized')) show('login');
  }
}

// ===== Zones + Map =====
let map, marker, circle, editingId = null;
let mapTried = false;

function initMap() {
  if (map || mapTried) return;
  mapTried = true;
  // ถ้าโหลด Leaflet ไม่สำเร็จ (เช่น เน็ตบล็อก CDN) → ยังกรอกพิกัดมือได้
  if (typeof L === 'undefined') {
    document.getElementById('map').innerHTML =
      '<div style="padding:24px;text-align:center;color:var(--muted)">แผนที่โหลดไม่ได้ (เชื่อมต่ออินเทอร์เน็ตไม่ได้) — กรอก Latitude/Longitude ด้านล่างหรือกด "ใช้ตำแหน่งฉัน" ได้เลย</div>';
    return;
  }
  map = L.map('map').setView([13.7649, 100.5383], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(map);
  map.on('click', (e) => setPoint(e.latlng.lat, e.latlng.lng));

  document.getElementById('zone-radius').addEventListener('input', drawCircle);
  document.getElementById('zone-lat').addEventListener('change', syncFromInputs);
  document.getElementById('zone-lng').addEventListener('change', syncFromInputs);
}

function setPoint(lat, lng) {
  document.getElementById('zone-lat').value = lat.toFixed(6);
  document.getElementById('zone-lng').value = lng.toFixed(6);
  if (!map) return; // ไม่มีแผนที่ก็แค่กรอกค่าในช่อง
  if (marker) marker.setLatLng([lat, lng]);
  else marker = L.marker([lat, lng]).addTo(map);
  drawCircle();
}

function syncFromInputs() {
  const lat = parseFloat(document.getElementById('zone-lat').value);
  const lng = parseFloat(document.getElementById('zone-lng').value);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    setPoint(lat, lng);
    if (map) map.setView([lat, lng]);
  }
}

function drawCircle() {
  if (!map) return;
  const lat = parseFloat(document.getElementById('zone-lat').value);
  const lng = parseFloat(document.getElementById('zone-lng').value);
  const radius = parseFloat(document.getElementById('zone-radius').value) || 0;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  if (circle) circle.setLatLng([lat, lng]).setRadius(radius);
  else circle = L.circle([lat, lng], { radius, color: '#06c755' }).addTo(map);
}

document.getElementById('btn-mylocation').onclick = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((pos) => {
    setPoint(pos.coords.latitude, pos.coords.longitude);
    if (map) map.setView([pos.coords.latitude, pos.coords.longitude], 16);
  });
};

document.getElementById('btn-savezone').onclick = saveZone;
document.getElementById('btn-cancelzone').onclick = resetZoneForm;

async function saveZone() {
  const errEl = document.getElementById('zone-err');
  errEl.textContent = '';
  const body = {
    name: document.getElementById('zone-name').value.trim(),
    center_lat: parseFloat(document.getElementById('zone-lat').value),
    center_lng: parseFloat(document.getElementById('zone-lng').value),
    radius_m: parseFloat(document.getElementById('zone-radius').value),
  };
  if (!body.name) return (errEl.textContent = 'กรุณาตั้งชื่อพื้นที่');
  if (!Number.isFinite(body.center_lat) || !Number.isFinite(body.center_lng)) {
    return (errEl.textContent = 'กรุณาเลือกจุดบนแผนที่');
  }
  try {
    if (editingId) {
      await api(`/zones/${editingId}`, { method: 'PUT', body, tokenKey: TOKEN_KEY });
    } else {
      await api('/zones', { method: 'POST', body, tokenKey: TOKEN_KEY });
    }
    resetZoneForm();
    loadZones();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

function resetZoneForm() {
  editingId = null;
  document.getElementById('zone-form-title').textContent = 'เพิ่มพื้นที่เช็คอินใหม่';
  document.getElementById('zone-name').value = '';
  document.getElementById('zone-radius').value = '200';
  document.getElementById('zone-lat').value = '';
  document.getElementById('zone-lng').value = '';
  document.getElementById('btn-cancelzone').classList.add('hidden');
  if (marker) { map.removeLayer(marker); marker = null; }
  if (circle) { map.removeLayer(circle); circle = null; }
}

async function loadZones() {
  const { zones } = await api('/zones', { tokenKey: TOKEN_KEY });
  const el = document.getElementById('zone-list');
  if (!zones.length) {
    el.innerHTML = '<p class="muted">ยังไม่มีพื้นที่ — เพิ่มด้านบน</p>';
    return;
  }
  el.innerHTML = zones
    .map((z) => {
      const badge = z.active
        ? '<span class="pill green">ใช้งาน</span>'
        : '<span class="pill gray">ปิด</span>';
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
        <div>
          <strong>${z.name}</strong> ${badge}<br/>
          <span class="muted">รัศมี ${z.radius_m} ม. · ${z.center_lat.toFixed(5)}, ${z.center_lng.toFixed(5)}</span>
        </div>
        <div style="display:flex;gap:8px;flex:0 0 auto">
          <button class="btn small secondary" data-edit="${z.id}">แก้ไข</button>
          <button class="btn small secondary" data-toggle="${z.id}">${z.active ? 'ปิด' : 'เปิด'}</button>
          <button class="btn small danger" data-del="${z.id}">ลบ</button>
        </div>
      </div>`;
    })
    .join('');

  el.querySelectorAll('[data-edit]').forEach((b) => {
    b.onclick = () => editZone(zones.find((z) => z.id === Number(b.dataset.edit)));
  });
  el.querySelectorAll('[data-toggle]').forEach((b) => {
    b.onclick = async () => {
      const z = zones.find((x) => x.id === Number(b.dataset.toggle));
      await api(`/zones/${z.id}`, { method: 'PUT', body: { active: !z.active }, tokenKey: TOKEN_KEY });
      loadZones();
    };
  });
  el.querySelectorAll('[data-del]').forEach((b) => {
    b.onclick = async () => {
      if (!confirm('ลบพื้นที่นี้?')) return;
      await api(`/zones/${b.dataset.del}`, { method: 'DELETE', tokenKey: TOKEN_KEY });
      loadZones();
    };
  });
}

function editZone(z) {
  editingId = z.id;
  document.getElementById('zone-form-title').textContent = `แก้ไข: ${z.name}`;
  document.getElementById('zone-name').value = z.name;
  document.getElementById('zone-radius').value = z.radius_m;
  document.getElementById('btn-cancelzone').classList.remove('hidden');
  setPoint(z.center_lat, z.center_lng);
  if (map) map.setView([z.center_lat, z.center_lng], 16);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Boot =====
if (getToken(TOKEN_KEY)) {
  enterDash();
} else {
  show('login');
}
