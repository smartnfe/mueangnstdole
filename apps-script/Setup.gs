/**
 * Setup.gs — ตั้งค่าครั้งแรก (รันมือจากหน้า editor เท่านั้น)
 *
 * วิธีใช้
 *   1) เปิดโปรเจกต์ Apps Script ที่ผูกกับสเปรดชีต
 *   2) เพิ่มไฟล์นี้ชื่อ Setup.gs  (ไฟล์นี้ไม่ถูกเรียกจาก doGet/doPost จึงไม่กระทบ API)
 *   3) เลือกฟังก์ชัน seedAdmin ใน dropdown แล้วกด Run
 *   4) อนุญาตสิทธิ์ (Authorize) ครั้งแรก
 *   5) ดูผลลัพธ์ในหน้า Execution log  — จะได้ชื่อผู้ใช้ + รหัสผ่านชั่วคราว
 *   6) ล็อกอินแล้วระบบจะบังคับตั้งรหัสผ่านใหม่ทันที (must_change = TRUE)
 *
 * ฟังก์ชันเสริม
 *   showUsers()                 — พิมพ์รายชื่อผู้ใช้ทั้งหมดในชีต Users
 *   promoteToAdmin('username')  — ยกให้ผู้ใช้เดิมเป็นแอดมิน (รหัสผ่านเดิมใช้ได้)
 *   resetPassword()             — ตั้งรหัสผ่านใหม่ให้บัญชีใน RESET_TARGET
 */

/* ---------- แก้ค่าเหล่านี้ก่อนกด Run ---------- */

const SEED_ADMIN = {
  username: 'admin',
  password: 'Admin@1234',   // รหัสชั่วคราว — ระบบจะบังคับเปลี่ยนตอนล็อกอินครั้งแรก
  name: 'ผู้ดูแลระบบ',
  position: 'ผู้ดูแลระบบ'
};

const RESET_TARGET = {
  username: 'admin',
  newPassword: 'Admin@1234'
};

const PROMOTE_USERNAME = '';   // ใส่ชื่อผู้ใช้เดิมที่ต้องการยกเป็นแอดมิน

/* ---------- ฟังก์ชันหลัก ---------- */

/**
 * สร้างบัญชีแอดมินคนแรก (ทำซ้ำได้อย่างปลอดภัย — ถ้ามีอยู่แล้วจะไม่สร้างซ้ำ)
 */
function seedAdmin() {
  ensureSchema_(true);

  const username = String(SEED_ADMIN.username || '').trim().toLowerCase();
  const password = String(SEED_ADMIN.password || '');

  if (!username || !password) {
    throw new Error('SEED_ADMIN ยังไม่ได้ตั้ง username/password');
  }
  const minLen = Number(getConfig_(true).PASSWORD_MIN || 8);
  if (password.length < minLen) {
    throw new Error('รหัสผ่านต้องยาวอย่างน้อย ' + minLen + ' ตัวอักษร (ปัจจุบัน ' + password.length + ')');
  }

  const existing = findUser_(username);

  if (existing) {
    if (existing.role === 'admin' && existing.active) {
      Logger.log('ℹ️ มีแอดมินชื่อ "%s" อยู่แล้ว (แถว %s) — ไม่ได้สร้างซ้ำ', username, existing.row);
      Logger.log('   ถ้าลืมรหัสผ่าน ให้รัน resetPassword() หรือแก้ในชีต Users');
      return { created: false, username: username, row: existing.row };
    }
    // มีบัญชีอยู่แต่ยังไม่ใช่แอดมิน/ถูกปิด → ยกสิทธิ์ให้
    setUserCell_(existing.row, COL.role, 'admin');
    setUserCell_(existing.row, COL.active, true);
    Logger.log('✅ ยกสิทธิ์บัญชีเดิม "%s" (แถว %s) เป็นแอดมินแล้ว', username, existing.row);
    Logger.log('   รหัสผ่านเดิมยังใช้ได้ (ถ้าเป็นรหัสแบบเก่า ระบบจะ hash ให้อัตโนมัติเมื่อล็อกอิน)');
    logEvent_('system', 'admin.promote', username, 'seedAdmin() พบบัญชีเดิมและยกสิทธิ์');
    return { created: false, promoted: true, username: username, row: existing.row };
  }

  // สร้างบัญชีใหม่ — เขียนตามลำดับคอลัมน์เดียวกับ COL ใน Sheets.gs
  const salt = makeSalt_();
  const hash = hashPassword_(salt, password);
  const sh = ensureSheet_(SH_USERS, USERS_HEADERS);

  sh.appendRow([
    username,        // 1 username
    hash,            // 2 password_hash
    SEED_ADMIN.name, // 3 name
    SEED_ADMIN.position, // 4 position
    salt,            // 5 salt
    'admin',         // 6 role
    true,            // 7 active
    true,            // 8 must_change  → บังคับตั้งรหัสใหม่ตอนล็อกอินครั้งแรก
    '',              // 9 last_login
    new Date()       // 10 created_at
  ]);

  cacheBustUsers_();
  logEvent_('system', 'admin.seed', username, 'สร้างแอดมินคนแรกด้วย Setup.gs');

  Logger.log('══════════════════════════════════════');
  Logger.log('✅ สร้างแอดมินคนแรกสำเร็จ');
  Logger.log('   ชื่อผู้ใช้ : %s', username);
  Logger.log('   รหัสผ่าน  : %s', password);
  Logger.log('   ชื่อที่แสดง: %s', SEED_ADMIN.name);
  Logger.log('   แถวในชีต : %s', sh.getLastRow());
  Logger.log('   ⚠️ ล็อกอินครั้งแรกแล้วระบบจะบังคับตั้งรหัสผ่านใหม่ทันที');
  Logger.log('   ⚠️ เปลี่ยน SEED_ADMIN.password ในไฟล์นี้เป็นอย่างอื่น หรือลบทิ้ง หลังตั้งค่าเสร็จ');
  Logger.log('══════════════════════════════════════');

  return { created: true, username: username, password: password, row: sh.getLastRow() };
}

/**
 * พิมพ์รายชื่อผู้ใช้ทั้งหมด (ชื่อผู้ใช้ / ชื่อ / สิทธิ์ / สถานะ / มีรหัสแบบเก่าหรือไม่)
 */
function showUsers() {
  const users = readUsers_(true);
  if (!users.length) {
    Logger.log('⚠️ ชีต Users ยังว่าง — ยังไม่มีผู้ใช้คนใดเลย ให้รัน seedAdmin() ก่อน');
    return users;
  }
  Logger.log('ผู้ใช้ทั้งหมด %s คน:', users.length);
  users.forEach(function (u) {
    const pwType = (u.salt && u.hash) ? 'hashed' : (u.hash ? 'plaintext(เก่า → จะถูก hash อัตโนมัติ)' : 'ยังไม่มีรหัส');
    Logger.log('  แถว %s | %s | %s | role=%s | active=%s | must_change=%s | %s',
      u.row, u.username, u.name || '-', u.role, u.active, u.mustChange, pwType);
  });
  const admins = users.filter(function (u) { return u.role === 'admin' && u.active; });
  Logger.log('แอดมินที่ใช้งานได้: %s คน', admins.length);
  if (!admins.length) Logger.log('❗ ไม่มีแอดมิน → รัน seedAdmin() หรือ promoteToAdmin("ชื่อผู้ใช้")');
  return users;
}

/**
 * ยกสิทธิ์ผู้ใช้เดิมเป็นแอดมิน (ไม่แตะรหัสผ่าน — รหัสเดิมใช้ได้)
 */
function promoteToAdmin(username) {
  const uname = String(username || PROMOTE_USERNAME || '').trim().toLowerCase();
  if (!uname) throw new Error('ระบุชื่อผู้ใช้ เช่น promoteToAdmin("somchai") หรือเติมค่า PROMOTE_USERNAME ด้านบนไฟล์');

  ensureSchema_(true);
  const u = findUser_(uname);
  if (!u) throw new Error('ไม่พบผู้ใช้ "' + uname + '" ในชีต Users (ดูรายชื่อด้วย showUsers())');

  setUserCell_(u.row, COL.role, 'admin');
  setUserCell_(u.row, COL.active, true);
  logEvent_('system', 'admin.promote', uname, 'promoteToAdmin()');

  Logger.log('✅ "%s" เป็นแอดมินแล้ว (แถว %s) — ล็อกอินด้วยรหัสผ่านเดิมได้เลย', uname, u.row);
  return publicUser_(findUser_(uname));
}

/**
 * ตั้งรหัสผ่านใหม่ให้บัญชีใน RESET_TARGET และบังคับเปลี่ยนตอนล็อกอินครั้งถัดไป
 */
function resetPassword() {
  const uname = String(RESET_TARGET.username || '').trim().toLowerCase();
  const next = String(RESET_TARGET.newPassword || '');
  const minLen = Number(getConfig_(true).PASSWORD_MIN || 8);
  if (!uname || next.length < minLen) {
    throw new Error('RESET_TARGET ไม่ถูกต้อง: ต้องมี username และรหัสผ่านยาวอย่างน้อย ' + minLen);
  }

  ensureSchema_(true);
  const u = findUser_(uname);
  if (!u) throw new Error('ไม่พบผู้ใช้ "' + uname + '"');

  const salt = makeSalt_();
  setUserCell_(u.row, COL.salt, salt);
  setUserCell_(u.row, COL.hash, hashPassword_(salt, next));
  setUserCell_(u.row, COL.mustChange, true);
  setUserCell_(u.row, COL.active, true);
  revokeSessions_(uname);   // ตัดเซสชันเดิมทั้งหมด

  Logger.log('✅ ตั้งรหัสผ่านใหม่ให้ "%s" แล้ว: %s (บังคับเปลี่ยนตอนล็อกอิน)', uname, next);
  return { reset: true, username: uname };
}

/* ---------- ตัวช่วยภายใน ---------- */
/* ใช้ setUserCell_() จาก Sheets.gs (ห้ามประกาศซ้ำ — จะชนกับตัวเดิม) */
