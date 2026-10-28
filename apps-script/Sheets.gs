/**
 * ชั้นเข้าถึง Google Sheet + cache + audit log
 * ห้ามสลับลำดับคอลัมน์ — โค้ดอ้างอิงด้วยดัชนี (COL)
 */

const SH_USERS  = 'Users';
const SH_LOGS   = 'Logs';
const SH_CONFIG = 'Config';
const SH_EVENTS = 'Events';

const COL = {
  username: 1, hash: 2, name: 3, position: 4, salt: 5,
  role: 6, active: 7, mustChange: 8, lastLogin: 9, createdAt: 10
};

const USERS_HEADERS  = ['username', 'password_hash', 'name', 'position', 'salt', 'role', 'active', 'must_change', 'last_login', 'created_at'];
const LOGS_HEADERS   = ['timestamp', 'username', 'workDate', 'plan', 'location', 'target', 'result', 'id', 'ai_model', 'updated_at', 'updated_by', 'deleted'];
const EVENTS_HEADERS = ['timestamp', 'actor', 'action', 'target', 'detail'];
const CONFIG_HEADERS = ['key', 'value'];

const DEFAULT_PROMPT_TEMPLATE = [
  'คุณเป็นผู้ช่วยเขียนรายงานผลการปฏิบัติงานของข้าราชการไทย',
  'หน่วยงาน: {{org}}',
  'จงเขียน "ผลการปฏิบัติงาน" จากข้อมูลต่อไปนี้ ให้เป็นภาษาไทยที่สุภาพ เป็นทางการ กระชับ',
  'ความยาว 3-4 บรรทัด ขึ้นต้นด้วยคำกริยา ระบุปริมาณ/จำนวนผู้เข้าร่วม/ผลที่เกิดขึ้นอย่างเป็นรูปธรรม',
  'ห้ามแต่งเติมตัวเลขหรือข้อมูลที่ไม่มีในสิ่งที่ให้มา และห้ามใส่คำลงท้ายหรือคำเกริ่นนำ',
  '',
  'วันที่: {{date}}',
  'กิจกรรม/แผนงาน: {{plan}}',
  'สถานที่: {{location}}',
  'เป้าหมาย: {{target}}'
].join('\n');

const DEFAULT_CONFIG = {
  ORG_NAME: 'ศูนย์ส่งเสริมการเรียนรู้ระดับอำเภอเมืองนครศรีธรรมราช',
  ORG_SHORT: 'สกร.ระดับอำเภอเมืองนครศรีธรรมราช',
  GEMINI_MODEL: 'gemini-flash-latest',
  MAX_AI_PER_HOUR: '20',
  PASSWORD_MIN: '8',
  PROMPT_TEMPLATE: DEFAULT_PROMPT_TEMPLATE
};

const SCHEMA_FLAG_KEY = 'schema_ok_v1';
const USERS_CACHE_KEY = 'users_all_v1';
const CFG_CACHE_KEY   = 'config_all_v1';

/* ---------- sheet access ---------- */

function ss_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw apiError_('SERVER_ERROR', 'สคริปต์ไม่ได้ผูกกับสเปรดชีต (ต้องสร้างจากเมนู ส่วนขยาย → Apps Script)');
  return ss;
}

function sh_(name) {
  return ss_().getSheetByName(name);
}

function ensureSheet_(name, headers) {
  let sh = sh_(name);
  if (!sh) {
    sh = ss_().insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    return sh;
  }
  // เติมหัวคอลัมน์ที่ขาด (ไม่ทับของเดิม)
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const existing = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  for (let i = 0; i < headers.length; i++) {
    const cur = String(existing[i] || '').trim();
    if (!cur) sh.getRange(1, i + 1).setValue(headers[i]).setFontWeight('bold');
  }
  return sh;
}

function ensureSchema_(force) {
  const cache = CacheService.getScriptCache();
  if (!force && cache.get(SCHEMA_FLAG_KEY)) return;

  ensureSheet_(SH_USERS, USERS_HEADERS);
  ensureSheet_(SH_LOGS, LOGS_HEADERS);
  ensureSheet_(SH_EVENTS, EVENTS_HEADERS);

  const cfgSheet = ensureSheet_(SH_CONFIG, CONFIG_HEADERS);
  const existing = readSheetRows_(cfgSheet, 0);
  const keys = {};
  existing.forEach(function (r) { if (r[0]) keys[String(r[0]).trim()] = true; });
  const toAdd = [];
  Object.keys(DEFAULT_CONFIG).forEach(function (k) {
    if (!keys[k]) toAdd.push([k, DEFAULT_CONFIG[k]]);
  });
  if (toAdd.length) {
    cfgSheet.getRange(cfgSheet.getLastRow() + 1, 1, toAdd.length, 2).setValues(toAdd);
  }

  cache.put(SCHEMA_FLAG_KEY, '1', 3600);
}

function readSheetRows_(sh, startRow) {
  const last = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (last < 2 || !lastCol) return [];
  return sh.getRange(2, 1, last - 1, lastCol).getValues();
}

/* ---------- config ---------- */

function getConfig_(force) {
  const cache = CacheService.getScriptCache();
  if (!force) {
    const hit = cache.get(CFG_CACHE_KEY);
    if (hit) {
      try { return JSON.parse(hit); } catch (e) {}
    }
  }
  const out = {};
  Object.keys(DEFAULT_CONFIG).forEach(function (k) { out[k] = DEFAULT_CONFIG[k]; });

  const sh = sh_(SH_CONFIG);
  if (sh) {
    readSheetRows_(sh, 0).forEach(function (r) {
      const k = String(r[0] || '').trim();
      if (!k) return;
      out[k] = r[1] === null || r[1] === undefined ? '' : String(r[1]);
    });
  }
  try { cache.put(CFG_CACHE_KEY, JSON.stringify(out), 300); } catch (e) {}
  return out;
}

function getProp_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || '';
}

/* ---------- users (read) ---------- */

function readUsers_(force) {
  const cache = CacheService.getScriptCache();
  if (!force) {
    const hit = cache.get(USERS_CACHE_KEY);
    if (hit) {
      try { return JSON.parse(hit); } catch (e) {}
    }
  }
  const sh = ensureSheet_(SH_USERS, USERS_HEADERS);
  const values = sh.getLastRow() > 1
    ? sh.getRange(2, 1, sh.getLastRow() - 1, USERS_HEADERS.length).getValues()
    : [];

  const users = [];
  values.forEach(function (r, i) {
    const username = String(r[0] || '').trim().toLowerCase();
    if (!username) return;
    const activeRaw = String(r[COL.active - 1] === '' || r[COL.active - 1] === null ? '' : r[COL.active - 1]).toUpperCase();
    users.push({
      row: i + 2,
      username: username,
      hash: String(r[COL.hash - 1] || '').trim(),
      name: String(r[COL.name - 1] || '').trim(),
      position: String(r[COL.position - 1] || '').trim(),
      salt: String(r[COL.salt - 1] || '').trim(),
      role: String(r[COL.role - 1] || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user',
      active: activeRaw !== 'FALSE',
      mustChange: String(r[COL.mustChange - 1] || '').toUpperCase() === 'TRUE',
      lastLogin: r[COL.lastLogin - 1] || '',
      createdAt: r[COL.createdAt - 1] || ''
    });
  });

  try { cache.put(USERS_CACHE_KEY, JSON.stringify(users), 30); } catch (e) {}
  return users;
}

function findUser_(username) {
  const uname = String(username || '').trim().toLowerCase();
  const list = readUsers_();
  for (let i = 0; i < list.length; i++) {
    if (list[i].username === uname) return list[i];
  }
  return null;
}

function cacheBustUsers_() {
  CacheService.getScriptCache().remove(USERS_CACHE_KEY);
}

function setUserCell_(row, col, value) {
  sh_(SH_USERS).getRange(row, col).setValue(value);
  cacheBustUsers_();
}

function publicUser_(u, includePrivate) {
  const out = {
    username: u.username,
    name: u.name,
    position: u.position,
    role: u.role,
    active: u.active,
    mustChange: !!u.mustChange,
    lastLogin: u.lastLogin ? String(u.lastLogin) : ''
  };
  if (includePrivate) out.row = u.row;
  return out;
}

/* ---------- audit ---------- */

function logEvent_(actor, action, target, detail) {
  try {
    const sh = ensureSheet_(SH_EVENTS, EVENTS_HEADERS);
    sh.appendRow([
      new Date(),
      String(actor || ''),
      String(action || ''),
      String(target || ''),
      String(detail || '').slice(0, 500)
    ]);
  } catch (e) {
    // audit ล้มเหลวไม่ควรทำให้ request พัง
  }
}

/* ---------- misc helpers ---------- */

function str_(v, max) {
  const s = (v === null || v === undefined) ? '' : String(v).trim();
  return max ? s.slice(0, max) : s;
}

function toIsoDate_(v) {
  if (!v) return '';
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const s = String(v).trim();
  const thai = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (thai) {
    return thai[3] + '-' + ('0' + thai[2]).slice(-2) + '-' + ('0' + thai[1]).slice(-2);
  }
  return s.slice(0, 10);
}

function hashStr_(text) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8);
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    out += ((raw[i] & 0xff) + 0x100).toString(16).slice(1);
  }
  return out;
}
