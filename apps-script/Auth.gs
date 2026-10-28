/**
 * ล็อกอิน / เซสชัน / เปลี่ยนรหัสผ่าน
 * รหัสผ่านเดิม (plain text ในคอลัมน์ B) จะถูก hash อัตโนมัติเมื่อล็อกอินสำเร็จครั้งแรก
 */

const SESSION_TTL_SEC = 8 * 3600;       // 8 ชั่วโมง
const SESSION_MAX_PER_USER = 5;
const MAX_LOGIN_FAILS = 5;
const LOGIN_LOCK_SEC = 10 * 60;

function makeSalt_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}

function hashPassword_(salt, password) {
  return hashStr_(String(salt) + '|' + String(password));
}

function authLogin_(p) {
  const username = str_(p.username, 60).toLowerCase();
  const password = p.password === null || p.password === undefined ? '' : String(p.password);
  if (!username || !password) {
    throw apiError_('VALIDATION', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
  }

  const cache = CacheService.getScriptCache();
  const lockKey = 'lf_' + username;
  const fails = Number(cache.get(lockKey) || 0);
  if (fails >= MAX_LOGIN_FAILS) {
    throw apiError_('AUTH_LOCKED', 'ล็อกอินผิดติดกันหลายครั้ง กรุณาลองใหม่ใน 10 นาที');
  }

  const u = findUser_(username);
  if (!u) {
    cache.put(lockKey, String(fails + 1), LOGIN_LOCK_SEC);
    throw apiError_('AUTH_INVALID', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }

  let passOk = false;
  let legacy = false;
  if (u.salt && u.hash) {
    passOk = (hashPassword_(u.salt, u.password === undefined ? password : password) === u.hash);
  } else if (u.hash) {
    // รหัสเดิมเก็บเป็น plain text → เทียบตรง ๆ แล้ว hash ทับ
    passOk = (u.hash === password);
    legacy = passOk;
  }

  if (!passOk) {
    cache.put(lockKey, String(fails + 1), LOGIN_LOCK_SEC);
    logEvent_(username, 'auth.login_failed', username, '');
    throw apiError_('AUTH_INVALID', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }

  if (!u.active) {
    throw apiError_('FORBIDDEN', 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
  }

  if (legacy || !u.salt) {
    const salt = makeSalt_();
    const sh = sh_(SH_USERS);
    sh.getRange(u.row, COL.salt).setValue(salt);
    sh.getRange(u.row, COL.hash).setValue(hashPassword_(salt, password));
    cacheBustUsers_();
  }

  cache.remove(lockKey);

  const session = createSession_(u);
  const sh = sh_(SH_USERS);
  sh.getRange(u.row, COL.lastLogin).setValue(new Date());
  cacheBustUsers_();

  logEvent_(u.username, 'auth.login', u.username, '');

  return {
    token: session.token,
    expiresAt: session.exp,
    user: publicUser_(u)
  };
}

function authLogout_(token) {
  if (token) {
    PropertiesService.getScriptProperties().deleteProperty('sess_' + token);
  }
  return { loggedOut: true };
}

function authChangePassword_(p, token) {
  const u = requireUser_(token);
  const current = p.currentPassword === null || p.currentPassword === undefined ? '' : String(p.currentPassword);
  const next = p.newPassword === null || p.newPassword === undefined ? '' : String(p.newPassword);
  const cfg = getConfig_();
  const minLen = Number(cfg.PASSWORD_MIN || 8);

  if (!current) throw apiError_('VALIDATION', 'กรุณากรอกรหัสผ่านปัจจุบัน');
  if (next.length < minLen) throw apiError_('VALIDATION', 'รหัสผ่านใหม่ต้องยาวอย่างน้อย ' + minLen + ' ตัวอักษร');

  let passOk = false;
  if (u.salt && u.hash) {
    passOk = (hashPassword_(u.salt, current) === u.hash);
  } else if (u.hash) {
    passOk = (u.hash === current);
  }
  if (!passOk) throw apiError_('AUTH_INVALID', 'รหัสผ่านปัจจุบันไม่ถูกต้อง');

  const salt = makeSalt_();
  const sh = sh_(SH_USERS);
  sh.getRange(u.row, COL.salt).setValue(salt);
  sh.getRange(u.row, COL.hash).setValue(hashPassword_(salt, next));
  sh.getRange(u.row, COL.mustChange).setValue(false);
  cacheBustUsers_();

  logEvent_(u.username, 'auth.change_password', u.username, '');
  return { changed: true };
}

/* ---------- sessions ---------- */

function createSession_(u) {
  const props = PropertiesService.getScriptProperties();
  pruneSessions_(props);

  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  const exp = Date.now() + SESSION_TTL_SEC * 1000;
  props.setProperty('sess_' + token, JSON.stringify({ u: u.username, exp: exp }));

  // จำกัดจำนวนอุปกรณ์ที่ล็อกอินพร้อมกัน
  const mine = [];
  const keys = props.getKeys();
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k.indexOf('sess_') !== 0) continue;
    try {
      const s = JSON.parse(props.getProperty(k));
      if (s && s.u === u.username) mine.push({ key: k, exp: s.exp || 0 });
    } catch (e) {}
  }
  if (mine.length > SESSION_MAX_PER_USER) {
    mine.sort(function (a, b) { return a.exp - b.exp; });
    const drop = mine.length - SESSION_MAX_PER_USER;
    for (let i = 0; i < drop; i++) props.deleteProperty(mine[i].key);
  }

  return { token: token, exp: exp };
}

function pruneSessions_(props) {
  const now = Date.now();
  const keys = props.getKeys();
  let checked = 0;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k.indexOf('sess_') !== 0) continue;
    if (++checked > 300) break;
    let s = null;
    try { s = JSON.parse(props.getProperty(k)); } catch (e) {}
    if (!s || !s.exp || s.exp < now) props.deleteProperty(k);
  }
}

function revokeSessions_(username) {
  const props = PropertiesService.getScriptProperties();
  const uname = String(username || '').toLowerCase();
  const keys = props.getKeys();
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k.indexOf('sess_') !== 0) continue;
    try {
      const s = JSON.parse(props.getProperty(k));
      if (s && String(s.u).toLowerCase() === uname) props.deleteProperty(k);
    } catch (e) {}
  }
}

function requireUser_(token) {
  if (!token) throw apiError_('AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบ');
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('sess_' + token);
  if (!raw) throw apiError_('AUTH_INVALID', 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');

  let s = null;
  try { s = JSON.parse(raw); } catch (e) {}
  if (!s || !s.exp || s.exp < Date.now()) {
    props.deleteProperty('sess_' + token);
    throw apiError_('AUTH_INVALID', 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  }

  const u = findUser_(s.u);
  if (!u) throw apiError_('AUTH_INVALID', 'ไม่พบบัญชีผู้ใช้');
  if (!u.active) throw apiError_('FORBIDDEN', 'บัญชีนี้ถูกปิดใช้งาน');
  if (u.mustChange) {
    // ยังใช้งานได้ แต่ frontend จะเด้งไปหน้าตั้งรหัสผ่านใหม่
  }
  return u;
}

function requireAdmin_(token) {
  const u = requireUser_(token);
  if (u.role !== 'admin') throw apiError_('FORBIDDEN', 'เฉพาะผู้ดูแลระบบเท่านั้น');
  return u;
}
