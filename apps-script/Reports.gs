/**
 * รายงานผลการปฏิบัติงาน (CRUD) — ผู้ใช้เห็น/แก้ของตัวเอง, แอดมินเห็นทั้งหมด
 */

const REPORTS_MAX_RESULT = 5000;
const Reports = {

  create: function (p, token) {
    const u = requireUser_(token);
    const workDate = toIsoDate_(p.workDate);
    const plan = str_(p.plan, 500);
    const location = str_(p.location, 200);
    const target = str_(p.target, 300);
    const result = str_(p.result, REPORTS_MAX_RESULT);

    if (!workDate || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) throw apiError_('VALIDATION', 'กรุณาระบุวันที่ปฏิบัติงาน (YYYY-MM-DD)');
    if (!plan) throw apiError_('VALIDATION', 'กรุณากรอกกิจกรรม/แผนงาน');
    if (!result) throw apiError_('VALIDATION', 'กรุณากรอกผลการปฏิบัติงาน');

    const id = newReportId_();
    const now = new Date();
    const sh = ensureSheet_(SH_LOGS, LOGS_HEADERS);
    sh.appendRow([now, u.username, workDate, plan, location, target, result, id, str_(p.aiModel, 60), now, u.username, false]);

    logEvent_(u.username, 'reports.create', id, plan.slice(0, 120));
    return { id: id };
  },

  list: function (p, token) {
    const u = requireUser_(token);
    const scope = str_(p.scope, 10) === 'all' && u.role === 'admin' ? 'all' : 'me';
    const limit = Math.min(Math.max(Number(p.limit) || 20, 1), 100);
    const offset = Math.max(Number(p.offset) || 0, 0);
    const q = str_(p.q, 100).toLowerCase();
    const from = toIsoDate_(p.from);
    const to = toIsoDate_(p.to);

    const rows = readLogs_();
    let items = rows.filter(function (r) {
      if (r.deleted) return false;
      if (scope === 'me' && r.username !== u.username) return false;
      if (from && r.workDate < from) return false;
      if (to && r.workDate > to) return false;
      if (q) {
        const hay = (r.plan + ' ' + r.result + ' ' + r.location + ' ' + r.target + ' ' + r.username).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });

    items.sort(function (a, b) { return b.ts - a.ts; });
    const total = items.length;
    const page = items.slice(offset, offset + limit).map(function (r) {
      return {
        id: r.id,
        workDate: r.workDate,
        plan: r.plan,
        location: r.location,
        target: r.target,
        result: r.result,
        aiModel: r.aiModel,
        owner: r.username,
        mine: r.username === u.username,
        updatedAt: r.updatedAt ? String(r.updatedAt) : ''
      };
    });

    return { items: page, total: total, offset: offset, limit: limit, hasMore: offset + page.length < total };
  },

  update: function (p, token) {
    const u = requireUser_(token);
    const id = str_(p.id, 60);
    if (!id) throw apiError_('VALIDATION', 'ไม่พบรหัสรายงาน');

    const row = findLogRow_(id);
    if (!row) throw apiError_('NOT_FOUND', 'ไม่พบรายงานนี้');
    if (row.username !== u.username && u.role !== 'admin') throw apiError_('FORBIDDEN', 'แก้ไขได้เฉพาะรายงานของตัวเอง');

    const sh = sh_(SH_LOGS);
    if (p.workDate !== undefined) {
      const d = toIsoDate_(p.workDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw apiError_('VALIDATION', 'วันที่ไม่ถูกต้อง');
      sh.getRange(row.row, 3).setValue(d);
    }
    if (p.plan !== undefined) sh.getRange(row.row, 4).setValue(str_(p.plan, 500));
    if (p.location !== undefined) sh.getRange(row.row, 5).setValue(str_(p.location, 200));
    if (p.target !== undefined) sh.getRange(row.row, 6).setValue(str_(p.target, 300));
    if (p.result !== undefined) {
      const result = str_(p.result, REPORTS_MAX_RESULT);
      if (!result) throw apiError_('VALIDATION', 'ผลการปฏิบัติงาน ว่างไม่ได้');
      sh.getRange(row.row, 7).setValue(result);
    }
    sh.getRange(row.row, 10).setValue(new Date());
    sh.getRange(row.row, 11).setValue(u.username);

    logEvent_(u.username, 'reports.update', id, '');
    return { updated: true, id: id };
  },

  remove: function (p, token) {
    const u = requireUser_(token);
    const id = str_(p.id, 60);
    const row = findLogRow_(id);
    if (!row) throw apiError_('NOT_FOUND', 'ไม่พบรายงานนี้');
    if (row.username !== u.username && u.role !== 'admin') throw apiError_('FORBIDDEN', 'ลบได้เฉพาะรายงานของตัวเอง');

    const sh = sh_(SH_LOGS);
    sh.getRange(row.row, 12).setValue(true);      // soft delete
    sh.getRange(row.row, 10).setValue(new Date());
    sh.getRange(row.row, 11).setValue(u.username);

    logEvent_(u.username, 'reports.delete', id, '');
    return { deleted: true, id: id };
  }
};

function newReportId_() {
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');
  return 'RPT-' + stamp + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
}

function readLogs_() {
  const sh = ensureSheet_(SH_LOGS, LOGS_HEADERS);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const values = sh.getRange(2, 1, last - 1, LOGS_HEADERS.length).getValues();
  const out = [];
  values.forEach(function (r, i) {
    const id = String(r[7] || '').trim();
    if (!id) return;
    const tsRaw = r[0];
    const ts = tsRaw instanceof Date ? tsRaw.getTime() : (Date.parse(tsRaw) || 0);
    out.push({
      row: i + 2,
      ts: ts,
      username: String(r[1] || '').trim().toLowerCase(),
      workDate: toIsoDate_(r[2]),
      plan: String(r[3] || ''),
      location: String(r[4] || ''),
      target: String(r[5] || ''),
      result: String(r[6] || ''),
      id: id,
      aiModel: String(r[8] || ''),
      updatedAt: r[9],
      deleted: String(r[11] || '').toUpperCase() === 'TRUE'
    });
  });
  return out;
}

function findLogRow_(id) {
  const rows = readLogs_();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].id === id) return rows[i];
  }
  return null;
}
