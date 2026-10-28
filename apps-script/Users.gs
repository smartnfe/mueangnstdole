/**
 * จัดการสมาชิก (เฉพาะ admin)
 * กันไม่ให้ปิด/ลดสิทธิ์แอดมินคนสุดท้าย และกันปิดบัญชีตัวเอง
 */

const Users = {

  list: function (p, token) {
    requireAdmin_(token);
    const q = str_(p.q, 60).toLowerCase();
    const list = readUsers_().filter(function (u) {
      if (!q) return true;
      return u.username.indexOf(q) >= 0
        || String(u.name).toLowerCase().indexOf(q) >= 0
        || String(u.position).toLowerCase().indexOf(q) >= 0;
    }).map(function (u) {
      return {
        row: u.row,
        username: u.username,
        name: u.name,
        position: u.position,
        role: u.role,
        active: u.active,
        mustChange: u.mustChange,
        lastLogin: u.lastLogin ? String(u.lastLogin) : '',
        createdAt: u.createdAt ? String(u.createdAt) : ''
      };
    });
    list.sort(function (a, b) {
      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
      return a.username < b.username ? -1 : 1;
    });
    return { users: list, total: list.length };
  },

  create: function (p, token) {
    const admin = requireAdmin_(token);
    const username = str_(p.username, 60).toLowerCase();
    const name = str_(p.name, 120);
    const position = str_(p.position, 120);
    const password = p.password === null || p.password === undefined ? '' : String(p.password);
    const role = str_(p.role, 10).toLowerCase() === 'admin' ? 'admin' : 'user';
    const cfg = getConfig_();
    const minLen = Number(cfg.PASSWORD_MIN || 8);

    if (!/^[a-z0-9._-]{3,60}$/.test(username)) {
      throw apiError_('VALIDATION', 'ชื่อผู้ใช้ต้องเป็น a-z, 0-9, จุด, ขีดล่าง หรือขีดกลาง 3-60 ตัว');
    }
    if (!name) throw apiError_('VALIDATION', 'กรุณากรอกชื่อ-สกุล');
    if (password.length < minLen) throw apiError_('VALIDATION', 'รหัสผ่านต้องยาวอย่างน้อย ' + minLen + ' ตัวอักษร');
    if (findUser_(username)) throw apiError_('CONFLICT', 'มีชื่อผู้ใช้นี้อยู่แล้ว');

    const salt = makeSalt_();
    const sh = ensureSheet_(SH_USERS, USERS_HEADERS);
    sh.appendRow([
      username,
      hashPassword_(salt, password),
      name,
      position,
      salt,
      role,
      true,
      true,           // must_change = true (บังคับตั้งรหัสใหม่ที่ล็อกอินครั้งแรก)
      '',
      new Date()
    ]);
    cacheBustUsers_();
    logEvent_(admin.username, 'users.create', username, 'role=' + role);
    return { created: true, username: username };
  },

  update: function (p, token) {
    const admin = requireAdmin_(token);
    const username = str_(p.username, 60).toLowerCase();
    const u = findUser_(username);
    if (!u) throw apiError_('NOT_FOUND', 'ไม่พบบัญชีผู้ใช้');

    const sh = sh_(SH_USERS);
    if (p.name !== undefined) {
      const name = str_(p.name, 120);
      if (!name) throw apiError_('VALIDATION', 'ชื่อ-สกุล ว่างไม่ได้');
      sh.getRange(u.row, COL.name).setValue(name);
    }
    if (p.position !== undefined) {
      sh.getRange(u.row, COL.position).setValue(str_(p.position, 120));
    }
    cacheBustUsers_();
    logEvent_(admin.username, 'users.update', username, '');
    return { updated: true };
  },

  setRole: function (p, token) {
    const admin = requireAdmin_(token);
    const username = str_(p.username, 60).toLowerCase();
    const role = str_(p.role, 10).toLowerCase() === 'admin' ? 'admin' : 'user';
    const u = findUser_(username);
    if (!u) throw apiError_('NOT_FOUND', 'ไม่พบบัญชีผู้ใช้');

    if (u.role === 'admin' && role !== 'admin') {
      if (u.username === admin.username) {
        throw apiError_('FORBIDDEN', 'ลดสิทธิ์ของตัวเองไม่ได้');
      }
      const admins = readUsers_().filter(function (x) { return x.role === 'admin' && x.active; });
      if (admins.length <= 1) throw apiError_('FORBIDDEN', 'ต้องมีแอดมินที่ใช้งานได้อย่างน้อย 1 คน');
    }

    setUserCell_(u.row, COL.role, role);
    logEvent_(admin.username, 'users.set_role', username, 'role=' + role);
    return { updated: true, role: role };
  },

  setActive: function (p, token) {
    const admin = requireAdmin_(token);
    const username = str_(p.username, 60).toLowerCase();
    const active = p.active === true || String(p.active).toLowerCase() === 'true';
    const u = findUser_(username);
    if (!u) throw apiError_('NOT_FOUND', 'ไม่พบบัญชีผู้ใช้');

    if (!active && u.username === admin.username) {
      throw apiError_('FORBIDDEN', 'ปิดบัญชีของตัวเองไม่ได้');
    }
    if (!active && u.role === 'admin') {
      const admins = readUsers_().filter(function (x) { return x.role === 'admin' && x.active; });
      if (admins.length <= 1) throw apiError_('FORBIDDEN', 'ต้องมีแอดมินที่ใช้งานได้อย่างน้อย 1 คน');
    }

    setUserCell_(u.row, COL.active, active);
    if (!active) revokeSessions_(username);
    logEvent_(admin.username, 'users.set_active', username, 'active=' + active);
    return { updated: true, active: active };
  },

  resetPassword: function (p, token) {
    const admin = requireAdmin_(token);
    const username = str_(p.username, 60).toLowerCase();
    const u = findUser_(username);
    if (!u) throw apiError_('NOT_FOUND', 'ไม่พบบัญชีผู้ใช้');

    const temp = makeTempPassword_(10);
    const salt = makeSalt_();
    const sh = sh_(SH_USERS);
    sh.getRange(u.row, COL.salt).setValue(salt);
    sh.getRange(u.row, COL.hash).setValue(hashPassword_(salt, temp));
    sh.getRange(u.row, COL.mustChange).setValue(true);
    cacheBustUsers_();
    revokeSessions_(username);

    logEvent_(admin.username, 'users.reset_password', username, '');
    // ส่งรหัสชั่วคราวกลับครั้งเดียว — ไม่บันทึกลงไหนอีก
    return { username: username, tempPassword: temp };
  }
};

function makeTempPassword_(len) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}
