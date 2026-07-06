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
const PANELS = ['report', 'students', 'zones'];
document.getElementById('tab-report').onclick = () => switchPanel('report');
document.getElementById('tab-students').onclick = () => switchPanel('students');
document.getElementById('tab-zones').onclick = () => switchPanel('zones');

function switchPanel(name) {
  for (const p of PANELS) {
    document.getElementById(`panel-${p}`).classList.toggle('hidden', p !== name);
    document.getElementById(`tab-${p}`).classList.toggle('secondary', p !== name);
  }
  if (name === 'report') loadReport();
  if (name === 'students') { loadStudents(); loadNotifications(); }
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
  refreshPendingBadge();
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

    drawCheckinMap(rows); // วาดแผนที่เช็คอิน (แสดงขอบเขต+หมุด แม้ยังไม่มีคนเช็คอิน)

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
          <td>${esc(r.student_code)}</td>
          <td>${esc(r.full_name)}</td>
          <td>${esc(r.class_room) || '-'}</td>
          <td>${pill}</td>
          <td>${fmtDateTime(r.checked_at)}</td>
          <td>${dist}</td>
          <td>${esc(r.guardian_phone) || '-'}</td>
        </tr>`;
      })
      .join('');
  } catch (err) {
    if (String(err.message).includes('unauthorized')) show('login');
  }
}

// ===== Zones + Map =====
let map, marker, circle, polyLayer, editingId = null;
let mapTried = false;
let zoneMode = 'circle';
let polygonPts = []; // [[lat,lng],...]

function initMap() {
  if (map || mapTried) return;
  mapTried = true;
  if (typeof L === 'undefined') {
    document.getElementById('map').innerHTML =
      '<div style="padding:24px;text-align:center;color:var(--muted)">แผนที่โหลดไม่ได้ (เชื่อมต่ออินเทอร์เน็ตไม่ได้) — กรอกพิกัดในช่องด้านล่างได้เลย</div>';
    return;
  }
  map = L.map('map').setView([13.7649, 100.5383], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19,
  }).addTo(map);
  map.on('click', (e) => {
    if (zoneMode === 'polygon') addVertex(e.latlng.lat, e.latlng.lng);
    else setPoint(e.latlng.lat, e.latlng.lng);
  });
}

// ---- listeners ที่ไม่พึ่งแผนที่ (ผูกเสมอ ให้ fallback ทำงานได้) ----
document.getElementById('zone-type').addEventListener('change', (e) => setZoneMode(e.target.value));
document.getElementById('zone-radius').addEventListener('input', drawCircle);
document.getElementById('zone-lat').addEventListener('change', syncFromInputs);
document.getElementById('zone-lng').addEventListener('change', syncFromInputs);
document.getElementById('polygon-points').addEventListener('input', () => {
  polygonPts = parsePolygonText();
  redrawPolygon();
});
document.getElementById('btn-clear-polygon').onclick = () => {
  polygonPts = [];
  document.getElementById('polygon-points').value = '';
  redrawPolygon();
};

function setZoneMode(mode) {
  zoneMode = mode;
  document.getElementById('zone-type').value = mode;
  document.getElementById('circle-fields').classList.toggle('hidden', mode !== 'circle');
  document.getElementById('polygon-fields').classList.toggle('hidden', mode !== 'polygon');
  document.getElementById('zone-hint').textContent = mode === 'polygon'
    ? 'คลิกบนแผนที่เพื่อเพิ่มจุดมุมทีละจุด (อย่างน้อย 3 จุด)'
    : 'คลิกบนแผนที่เพื่อวางจุดศูนย์กลาง แล้วปรับรัศมี';
  if (!map) return;
  if (mode === 'polygon') {
    if (marker) { map.removeLayer(marker); marker = null; }
    if (circle) { map.removeLayer(circle); circle = null; }
  } else if (polyLayer) {
    map.removeLayer(polyLayer); polyLayer = null;
  }
}

// ---- วงกลม ----
function setPoint(lat, lng) {
  document.getElementById('zone-lat').value = lat.toFixed(6);
  document.getElementById('zone-lng').value = lng.toFixed(6);
  if (!map) return;
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

// ---- polygon ----
function addVertex(lat, lng) {
  polygonPts.push([lat, lng]);
  syncPolygonText();
  redrawPolygon();
}
function parsePolygonText() {
  const pts = [];
  for (const line of document.getElementById('polygon-points').value.split('\n')) {
    const m = line.trim().split(',');
    if (m.length !== 2) continue;
    const lat = parseFloat(m[0]), lng = parseFloat(m[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) pts.push([lat, lng]);
  }
  return pts;
}
function syncPolygonText() {
  document.getElementById('polygon-points').value =
    polygonPts.map((p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`).join('\n');
  updatePolygonCount();
}
function updatePolygonCount() {
  document.getElementById('polygon-count').textContent = `${polygonPts.length} จุด`;
}
function redrawPolygon() {
  updatePolygonCount();
  if (!map) return;
  if (polyLayer) { map.removeLayer(polyLayer); polyLayer = null; }
  if (polygonPts.length >= 2) {
    polyLayer = L.polygon(polygonPts, { color: '#06c755' }).addTo(map);
  }
}

document.getElementById('btn-mylocation').onclick = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude: lat, longitude: lng } = pos.coords;
    if (zoneMode === 'polygon') addVertex(lat, lng);
    else setPoint(lat, lng);
    if (map) map.setView([lat, lng], 16);
  });
};

document.getElementById('btn-savezone').onclick = saveZone;
document.getElementById('btn-cancelzone').onclick = resetZoneForm;

async function saveZone() {
  const errEl = document.getElementById('zone-err');
  errEl.textContent = '';
  const name = document.getElementById('zone-name').value.trim();
  if (!name) return (errEl.textContent = 'กรุณาตั้งชื่อพื้นที่');

  let body;
  if (zoneMode === 'polygon') {
    const pts = polygonPts.length ? polygonPts : parsePolygonText();
    if (pts.length < 3) return (errEl.textContent = 'รูปหลายเหลี่ยมต้องมีอย่างน้อย 3 จุด');
    body = { name, type: 'polygon', polygon: pts };
  } else {
    const lat = parseFloat(document.getElementById('zone-lat').value);
    const lng = parseFloat(document.getElementById('zone-lng').value);
    const radius = parseFloat(document.getElementById('zone-radius').value);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return (errEl.textContent = 'กรุณาเลือกจุดบนแผนที่ หรือกรอกพิกัด');
    }
    body = { name, type: 'circle', center_lat: lat, center_lng: lng, radius_m: radius };
  }
  try {
    if (editingId) await api(`/zones/${editingId}`, { method: 'PUT', body, tokenKey: TOKEN_KEY });
    else await api('/zones', { method: 'POST', body, tokenKey: TOKEN_KEY });
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
  document.getElementById('polygon-points').value = '';
  polygonPts = [];
  document.getElementById('btn-cancelzone').classList.add('hidden');
  if (map) {
    if (marker) { map.removeLayer(marker); marker = null; }
    if (circle) { map.removeLayer(circle); circle = null; }
    if (polyLayer) { map.removeLayer(polyLayer); polyLayer = null; }
  }
  setZoneMode('circle');
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
      const shape = z.type === 'polygon'
        ? `รูปหลายเหลี่ยม · ${JSON.parse(z.polygon || '[]').length} จุด`
        : `วงกลม · รัศมี ${z.radius_m} ม. · ${z.center_lat.toFixed(5)}, ${z.center_lng.toFixed(5)}`;
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
        <div>
          <strong>${esc(z.name)}</strong> ${badge}<br/>
          <span class="muted">${shape}</span>
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
  document.getElementById('btn-cancelzone').classList.remove('hidden');
  if (z.type === 'polygon') {
    setZoneMode('polygon');
    polygonPts = JSON.parse(z.polygon || '[]');
    syncPolygonText();
    redrawPolygon();
    if (map && polyLayer) map.fitBounds(polyLayer.getBounds(), { padding: [30, 30] });
  } else {
    setZoneMode('circle');
    document.getElementById('zone-radius').value = z.radius_m;
    setPoint(z.center_lat, z.center_lng);
    if (map) map.setView([z.center_lat, z.center_lng], 16);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== แผนที่การเช็คอิน (ในแท็บรายงาน) =====
let cmap, cmapTried = false, cmapLayers = [];

function initCheckinMap() {
  if (cmap || cmapTried) return;
  cmapTried = true;
  if (typeof L === 'undefined') {
    document.getElementById('checkin-map').innerHTML =
      '<div style="padding:24px;text-align:center;color:var(--muted)">แผนที่โหลดไม่ได้ (เชื่อมต่ออินเทอร์เน็ตไม่ได้)</div>';
    return;
  }
  cmap = L.map('checkin-map').setView([13.7649, 100.5383], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19,
  }).addTo(cmap);
}

async function drawCheckinMap(rows) {
  initCheckinMap();
  if (!cmap) return;
  cmapLayers.forEach((l) => cmap.removeLayer(l));
  cmapLayers = [];

  // ขอบเขตพื้นที่ที่กำหนด
  try {
    const { zones } = await api('/zones', { tokenKey: TOKEN_KEY });
    zones.filter((z) => z.active).forEach((z) => {
      const style = { color: '#06c755', weight: 2, fillOpacity: 0.08 };
      const layer = z.type === 'polygon' && z.polygon
        ? L.polygon(JSON.parse(z.polygon), style)
        : L.circle([z.center_lat, z.center_lng], { radius: z.radius_m, ...style });
      layer.addTo(cmap);
      cmapLayers.push(layer);
    });
  } catch { /* ignore */ }

  // หมุดนักเรียนที่เช็คอิน
  const pts = [];
  rows.filter((r) => r.lat != null && r.status).forEach((r) => {
    const inRange = r.status === 'in_range';
    const m = L.circleMarker([r.lat, r.lng], {
      radius: 8, color: '#fff', weight: 2,
      fillColor: inRange ? '#06c755' : '#e5484d', fillOpacity: 1,
    });
    m.bindPopup(
      `<b>${esc(r.full_name)}</b><br>${inRange ? '🟢 อยู่ในพื้นที่' : '🔴 นอกพื้นที่'} · ${r.distance_m} ม.`,
    );
    m.addTo(cmap);
    cmapLayers.push(m);
    pts.push([r.lat, r.lng]);
  });

  if (pts.length) cmap.fitBounds(pts, { padding: [40, 40], maxZoom: 17 });
  setTimeout(() => cmap.invalidateSize(), 60);
}

// ===== Students (ตรวจสอบ/อนุมัติ) =====
let studentFilter = 'all';
let editingStudentId = null;

const STATUS_PILL = {
  pending: '<span class="pill gray">รอตรวจสอบ</span>',
  approved: '<span class="pill green">อนุมัติแล้ว</span>',
  rejected: '<span class="pill red">ปฏิเสธ</span>',
};

document.querySelectorAll('#panel-students [data-filter]').forEach((b) => {
  b.onclick = () => {
    studentFilter = b.dataset.filter;
    loadStudents();
  };
});

async function refreshPendingBadge() {
  try {
    const { summary } = await api('/manage/students?status=pending', { tokenKey: TOKEN_KEY });
    const badge = document.getElementById('tab-pending-badge');
    badge.textContent = summary.pending;
    badge.classList.toggle('hidden', summary.pending === 0);
  } catch {
    /* ignore */
  }
}

async function loadStudents() {
  const q = studentFilter === 'all' ? '' : `?status=${studentFilter}`;
  let data;
  try {
    data = await api(`/manage/students${q}`, { tokenKey: TOKEN_KEY });
  } catch (err) {
    if (String(err.message).includes('unauthorized')) show('login');
    return;
  }
  const { students, summary } = data;

  document.getElementById('students-summary').innerHTML = `
    <div class="card stat"><div class="n">${summary.pending}</div><div class="l">รอตรวจสอบ</div></div>
    <div class="card stat"><div class="n" style="color:var(--green)">${summary.approved}</div><div class="l">อนุมัติแล้ว</div></div>
    <div class="card stat"><div class="n" style="color:var(--red)">${summary.rejected}</div><div class="l">ปฏิเสธ</div></div>`;

  const badge = document.getElementById('tab-pending-badge');
  badge.textContent = summary.pending;
  badge.classList.toggle('hidden', summary.pending === 0);

  const list = document.getElementById('students-list');
  if (!students.length) {
    list.innerHTML = '<p class="muted">ไม่มีนักเรียนในหมวดนี้</p>';
    return;
  }
  list.innerHTML = students
    .map((s) => {
      const note = s.status === 'rejected' && s.review_note
        ? `<div class="muted" style="color:var(--red)">เหตุผล: ${esc(s.review_note)}</div>`
        : '';
      const approveBtn = s.status !== 'approved'
        ? `<button class="btn small" data-approve="${s.id}">อนุมัติ</button>` : '';
      const rejectBtn = s.status !== 'rejected'
        ? `<button class="btn small danger" data-reject="${s.id}">ปฏิเสธ</button>` : '';
      return `<div class="student-card">
        <div>
          <div><strong>${esc(s.full_name)}</strong> ${STATUS_PILL[s.status]}</div>
          <div class="muted">${esc(s.class_room) || '-'} · เลขที่ ${esc(s.student_code)}</div>
          <div class="muted">โทร ${esc(s.phone) || '-'} · ผู้ปกครอง ${esc(s.guardian_phone) || '-'}</div>
          ${note}
        </div>
        <div class="actions">
          ${approveBtn}
          ${rejectBtn}
          <button class="btn small secondary" data-edits="${s.id}">แก้ไข</button>
          <button class="btn small secondary" data-dels="${s.id}">ลบ</button>
        </div>
      </div>`;
    })
    .join('');

  list.querySelectorAll('[data-approve]').forEach((b) => {
    b.onclick = () => setStatus(Number(b.dataset.approve), 'approved');
  });
  list.querySelectorAll('[data-reject]').forEach((b) => {
    b.onclick = () => rejectStudent(Number(b.dataset.reject));
  });
  list.querySelectorAll('[data-edits]').forEach((b) => {
    b.onclick = () => openStudentModal(students.find((s) => s.id === Number(b.dataset.edits)));
  });
  list.querySelectorAll('[data-dels]').forEach((b) => {
    b.onclick = async () => {
      if (!confirm('ลบนักเรียนคนนี้และประวัติเช็คอินทั้งหมด?')) return;
      await api(`/manage/students/${b.dataset.dels}`, { method: 'DELETE', tokenKey: TOKEN_KEY });
      loadStudents();
    };
  });
}

async function setStatus(id, status, note) {
  await api(`/manage/students/${id}/status`, {
    method: 'POST',
    body: { status, note },
    tokenKey: TOKEN_KEY,
  });
  loadStudents();
  loadNotifications();
}

async function loadNotifications() {
  let data;
  try {
    data = await api('/manage/notifications', { tokenKey: TOKEN_KEY });
  } catch {
    return;
  }
  const el = document.getElementById('notif-list');
  if (!data.notifications.length) {
    el.innerHTML = '<p class="muted">ยังไม่มีการแจ้งเตือน</p>';
    return;
  }
  el.innerHTML = data.notifications
    .slice(0, 10)
    .map((n) => {
      const who = n.target_type === 'admin'
        ? '<span class="pill gray">ถึงครู</span>'
        : '<span class="pill green">ถึงนักเรียน</span>';
      const via = n.delivered
        ? '<span class="pill green">ส่ง LINE แล้ว</span>'
        : '<span class="pill gray">log</span>';
      return `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div>${who} ${via} <span class="muted" style="font-size:12px">${fmtDateTime(n.created_at)}</span></div>
        <div>${esc(n.text)}</div>
      </div>`;
    })
    .join('');
}

function rejectStudent(id) {
  const note = prompt('เหตุผลที่ปฏิเสธ (นักเรียนจะเห็นข้อความนี้):', 'ข้อมูลไม่ถูกต้อง');
  if (note === null) return; // กดยกเลิก
  setStatus(id, 'rejected', note);
}

// ----- edit modal -----
function openStudentModal(s) {
  editingStudentId = s.id;
  document.getElementById('s-code').value = s.student_code;
  document.getElementById('s-name').value = s.full_name;
  document.getElementById('s-class').value = s.class_room;
  document.getElementById('s-phone').value = s.phone;
  document.getElementById('s-guardian').value = s.guardian_phone;
  document.getElementById('s-err').textContent = '';
  document.getElementById('student-modal').classList.remove('hidden');
}

document.getElementById('s-cancel').onclick = () =>
  document.getElementById('student-modal').classList.add('hidden');

document.getElementById('s-save').onclick = async () => {
  const errEl = document.getElementById('s-err');
  errEl.textContent = '';
  const body = {
    student_code: document.getElementById('s-code').value.trim(),
    full_name: document.getElementById('s-name').value.trim(),
    class_room: document.getElementById('s-class').value.trim(),
    phone: document.getElementById('s-phone').value.trim(),
    guardian_phone: document.getElementById('s-guardian').value.trim(),
  };
  if (!body.student_code || !body.full_name) {
    errEl.textContent = 'ต้องกรอกเลขประจำตัวและชื่อ-สกุล';
    return;
  }
  try {
    await api(`/manage/students/${editingStudentId}`, { method: 'PUT', body, tokenKey: TOKEN_KEY });
    document.getElementById('student-modal').classList.add('hidden');
    loadStudents();
  } catch (err) {
    errEl.textContent = err.message;
  }
};

function esc(v) {
  return String(v ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );
}

// ===== Boot =====
if (getToken(TOKEN_KEY)) {
  enterDash();
} else {
  show('login');
}
