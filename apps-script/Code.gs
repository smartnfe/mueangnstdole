/**
 * ระบบรายงานผลการปฏิบัติงาน — JSON API v1
 * ไฟล์นี้เป็นประตูเดียว (router) ของทุก request
 *
 * Deploy: New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 */

const API_VERSION = '1.0.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

/* ---------- response helpers ---------- */

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data, requestId) {
  return jsonOut_({ ok: true, data: data || {}, requestId: requestId || '' });
}

function fail_(code, message, requestId) {
  return jsonOut_({ ok: false, error: { code: code, message: message }, requestId: requestId || '' });
}

function apiError_(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

/* ---------- entry points ---------- */

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.action === 'ping') {
    return jsonOut_({ ok: true, data: { pong: true, time: new Date().toISOString() } });
  }
  return jsonOut_({
    ok: true,
    data: { service: 'report-api', version: API_VERSION, hint: 'POST JSON {action, token, payload}' }
  });
}

function doPost(e) {
  const requestId = 'req_' + Utilities.getUuid().slice(0, 8);
  let req = {};
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw) throw apiError_('VALIDATION', 'ไม่พบข้อมูลที่ส่งมา');
    try {
      req = JSON.parse(raw);
    } catch (parseErr) {
      throw apiError_('VALIDATION', 'รูปแบบ JSON ไม่ถูกต้อง');
    }
    if (!req || !req.action) throw apiError_('VALIDATION', 'ต้องระบุ action');

    ensureSchema_();
    const data = route_(req);
    return ok_(data, requestId);
  } catch (err) {
    const code = (err && err.code) || 'SERVER_ERROR';
    const message = (err && err.code)
      ? err.message
      : 'เซิร์ฟเวอร์ผิดพลาด: ' + ((err && err.message) || String(err));
    try {
      logEvent_('system', 'api.error', String(req.action || '-'), code + ' | ' + message);
    } catch (ignore) {}
    return fail_(code, message, requestId);
  }
}

function route_(req) {
  const action = String(req.action || '');
  const p = req.payload || {};
  const token = req.token || '';

  switch (action) {
    case 'auth.login':          return authLogin_(p);
    case 'auth.logout':         return authLogout_(token);
    case 'auth.me':             return { user: publicUser_(requireUser_(token)) };
    case 'auth.changePassword': return authChangePassword_(p, token);

    case 'ai.generate':         return Ai.generate(p, token);

    case 'reports.create':      return Reports.create(p, token);
    case 'reports.list':        return Reports.list(p, token);
    case 'reports.update':      return Reports.update(p, token);
    case 'reports.delete':      return Reports.remove(p, token);

    case 'users.list':          return Users.list(p, token);
    case 'users.create':        return Users.create(p, token);
    case 'users.update':        return Users.update(p, token);
    case 'users.resetPassword': return Users.resetPassword(p, token);
    case 'users.setActive':     return Users.setActive(p, token);
    case 'users.setRole':       return Users.setRole(p, token);

    case 'stats.overview':      return Stats.overview(p, token);

    default:
      throw apiError_('VALIDATION', 'ไม่รู้จัก action: ' + action);
  }
}

/* ---------- setup (รันด้วยมือ 1 ครั้งจาก editor) ---------- */

/**
 * ตั้งค่าครั้งแรก: สร้างชีต/หัวคอลัมน์ที่ขาด + ตั้ง role ให้บัญชีเดิม
 * บัญชีแรกที่ active จะได้สิทธิ์ admin อัตโนมัติ (ถ้ายังไม่มีใครเป็นแอดมิน)
 */
function setup() {
  ensureSchema_(true);
  const users = readUsers_(true);
  const hasAdmin = users.some(function (u) { return u.role === 'admin' && u.active; });
  if (!hasAdmin && users.length) {
    setUserCell_(users[0].row, COL.role, 'admin');
    cacheBustUsers_();
  }
  const cfg = getConfig_();
  const out = [];
  out.push('Users: ' + users.length + ' บัญชี');
  out.push('Admin: ' + (hasAdmin ? 'มีอยู่แล้ว' : users[0] ? users[0].username : 'ไม่มีบัญชี'));
  out.push('Config: ' + Object.keys(cfg).length + ' คีย์');
  out.push('GEMINI_API_KEY: ' + (getProp_('GEMINI_API_KEY') ? 'ตั้งแล้ว' : 'ยังไม่ได้ตั้ง'));
  Logger.log(out.join('\n'));
  return out.join(' | ');
}

function ping() {
  return doGet({ parameter: { action: 'ping' } }).getContent();
}
