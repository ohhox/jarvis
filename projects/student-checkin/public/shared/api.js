// Helper เรียก API + จัดการ token ใน localStorage
export function getToken(key) {
  return localStorage.getItem(key);
}
export function setToken(key, value) {
  localStorage.setItem(key, value);
}
export function clearToken(key) {
  localStorage.removeItem(key);
}

export async function api(path, { method = 'GET', body, tokenKey } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (tokenKey) {
    const token = getToken(tokenKey);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    throw new Error(data?.error || `เกิดข้อผิดพลาด (${res.status})`);
  }
  return data;
}

export function fmtDateTime(iso) {
  if (!iso) return '-';
  // SQLite เก็บเป็น UTC 'YYYY-MM-DD HH:MM:SS'
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
