const LS_URL = 'rpt_api_url';
const SS_TOKEN = 'rpt_token';

let token = '';
try { token = sessionStorage.getItem(SS_TOKEN) || ''; } catch (e) { token = ''; }

export class ApiError extends Error {
  constructor(code, message) {
    super(message || 'เกิดข้อผิดพลาด');
    this.name = 'ApiError';
    this.code = code || 'ERROR';
  }
}

export function getApiUrl() {
  let saved = '';
  try { saved = localStorage.getItem(LS_URL) || ''; } catch (e) { saved = ''; }
  return (saved || (window.REPORT_CONFIG && window.REPORT_CONFIG.apiUrl) || '').trim();
}

export function setApiUrl(url) {
  const clean = String(url || '').trim();
  try {
    if (clean) localStorage.setItem(LS_URL, clean);
    else localStorage.removeItem(LS_URL);
  } catch (e) {}
}

export function getToken() { return token; }

export function setToken(t) {
  token = t || '';
  try {
    if (token) sessionStorage.setItem(SS_TOKEN, token);
    else sessionStorage.removeItem(SS_TOKEN);
  } catch (e) {}
}

export async function api(action, payload = {}) {
  const url = getApiUrl();
  if (!url) throw new ApiError('CONFIG', 'ยังไม่ได้ตั้งค่าที่อยู่ API (Apps Script Web App)');

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token, payload: payload || {} }),
      redirect: 'follow'
    });
  } catch (e) {
    throw new ApiError('NETWORK', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต');
  }

  const text = await res.text();
  let out;
  try {
    out = JSON.parse(text);
  } catch (e) {
    throw new ApiError('SERVER_ERROR', 'เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ (ตรวจ URL /exec และสิทธิ์การเข้าถึง)');
  }

  if (!out || out.ok !== true) {
    const err = (out && out.error) || {};
    if (err.code === 'AUTH_INVALID' || err.code === 'AUTH_REQUIRED') setToken('');
    throw new ApiError(err.code || 'SERVER_ERROR', err.message || 'เกิดข้อผิดพลาด');
  }
  return out.data || {};
}
