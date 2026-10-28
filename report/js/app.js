import { api, ApiError, getApiUrl, setApiUrl, setToken, getToken } from './api.js';
import {
  el, clear, $, $$, toast, openModal, closeModal, confirmDialog,
  fmtThaiDate, fmtDateTime, todayIso
} from './ui.js';
import { initAdmin, adminShowUsers, adminShowStats } from './admin.js';

const state = {
  user: null,
  tab: 'report',
  editingId: null,
  scope: 'me',
  list: { offset: 0, limit: 20, total: 0, items: [], hasMore: false }
};

const els = {};

function cacheEls() {
  [
    'setup', 'setupUrl', 'setupSave', 'setupMsg',
    'login', 'loginForm', 'loginUser', 'loginPass', 'loginMsg', 'orgName', 'loginTitle',
    'app', 'userChip', 'btnLogout', 'tabs',
    'fDate', 'fPlan', 'fLocation', 'fTarget', 'fResult',
    'btnAi', 'aiStatus', 'charCount', 'btnSave', 'btnCancelEdit',
    'hFrom', 'hTo', 'hQ', 'hScope', 'btnRefresh', 'hList', 'hSummary', 'btnMore',
    'tab-users', 'tab-stats'
  ].forEach(function (id) {
    els[id] = document.getElementById(id);
  });
}

/* ---------------- screens ---------------- */

function showScreen(name) {
  ['setup', 'login'].forEach(function (n) {
    const node = document.getElementById(n);
    if (node) node.classList.toggle('hidden', n !== name);
  });
  els.app.classList.toggle('hidden', name !== 'app');
  window.scrollTo(0, 0);
}

/* ---------------- boot ---------------- */

async function boot() {
  cacheEls();

  if (window.REPORT_CONFIG && window.REPORT_CONFIG.orgName) {
    els.orgName.textContent = window.REPORT_CONFIG.orgName;
  }

  els.setupSave.addEventListener('click', function () {
    const url = String(els.setupUrl.value || '').trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec/.test(url)) {
      els.setupMsg.textContent = 'URL ต้องขึ้นต้นด้วย https://script.google.com/macros/s/ และลงท้ายด้วย /exec';
      return;
    }
    setApiUrl(url);
    els.setupMsg.textContent = '';
    boot();
  });

  if (!getApiUrl()) {
    showScreen('setup');
    return;
  }

  if (getToken()) {
    try {
      const me = await api('auth.me');
      enterApp(me.user);
      return;
    } catch (e) {
      setToken('');
    }
  }
  showScreen('login');
}

/* ---------------- login ---------------- */

function wireLogin() {
  els.loginForm.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    els.loginMsg.textContent = '';
    const btn = els.loginForm.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'กำลังเข้าสู่ระบบ...';
    try {
      const out = await api('auth.login', {
        username: String(els.loginUser.value || '').trim(),
        password: String(els.loginPass.value || '')
      });
      setToken(out.token);
      els.loginPass.value = '';
      enterApp(out.user);
    } catch (e) {
      els.loginMsg.textContent = e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'เข้าสู่ระบบ';
    }
  });
}

function enterApp(user) {
  state.user = user;
  showScreen('app');
  renderUserChip();

  const isAdmin = user.role === 'admin';
  $$('.admin-only').forEach(function (n) { n.classList.toggle('hidden', !isAdmin); });

  els.fDate.value = els.fDate.value || todayIso();
  switchTab('report');
  updateCharCount();

  if (user.mustChange) {
    toast('กรุณาตั้งรหัสผ่านใหม่ก่อนเริ่มใช้งาน', 'err');
    openChangePassword(true);
  }
}

function renderUserChip() {
  const u = state.user;
  if (!u) return;
  clear(els.userChip);
  els.userChip.appendChild(el('span', { text: u.name || u.username }));
  els.userChip.appendChild(el('b', { text: u.role === 'admin' ? ' · ผู้ดูแลระบบ' : '' }));
}

function logout() {
  api('auth.logout').catch(function () {});
  setToken('');
  state.user = null;
  state.editingId = null;
  showScreen('login');
  toast('ออกจากระบบแล้ว');
}

/* ---------------- tabs ---------------- */

function switchTab(name) {
  if (state.user && state.user.role !== 'admin' && (name === 'users' || name === 'stats')) return;
  state.tab = name;
  $$('#tabs .tab').forEach(function (b) {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  ['report', 'history', 'users', 'stats'].forEach(function (t) {
    const pane = document.getElementById('tab-' + t);
    if (pane) pane.classList.toggle('hidden', t !== name);
  });

  if (name === 'history') loadHistory(true);
  if (name === 'users') adminShowUsers();
  if (name === 'stats') adminShowStats();
}

/* ---------------- report form ---------------- */

function updateCharCount() {
  const len = els.fResult.value.length;
  els.charCount.textContent = len.toLocaleString('th-TH') + ' / 5,000';
  els.charCount.className = len > 4800 ? 'error' : 'muted';
}

function setEditing(id) {
  state.editingId = id;
  els.btnSave.textContent = id ? 'บันทึกการแก้ไข' : 'บันทึก';
  els.btnCancelEdit.classList.toggle('hidden', !id);
}

function clearForm() {
  els.fPlan.value = '';
  els.fLocation.value = '';
  els.fTarget.value = '';
  els.fResult.value = '';
  els.fDate.value = todayIso();
  els.aiStatus.textContent = '';
  setEditing(null);
  updateCharCount();
}

async function saveReport() {
  const payload = {
    workDate: els.fDate.value || todayIso(),
    plan: els.fPlan.value.trim(),
    location: els.fLocation.value.trim(),
    target: els.fTarget.value.trim(),
    result: els.fResult.value.trim()
  };

  if (!payload.plan) { toast('กรุณากรอกกิจกรรม/แผนงาน', 'err'); els.fPlan.focus(); return; }
  if (!payload.result) { toast('กรุณากรอกผลการปฏิบัติงาน', 'err'); els.fResult.focus(); return; }

  const editing = state.editingId;
  els.btnSave.disabled = true;
  els.btnSave.textContent = 'กำลังบันทึก...';
  try {
    if (editing) {
      await api('reports.update', Object.assign({ id: editing }, payload));
      toast('แก้ไขรายงานแล้ว', 'ok');
    } else {
      await api('reports.create', payload);
      toast('บันทึกรายงานแล้ว', 'ok');
    }
    clearForm();
    state.list.offset = 0;
  } catch (e) {
    toast(e.message, 'err');
  } finally {
    els.btnSave.disabled = false;
    setEditing(state.editingId);
  }
}

async function aiGenerate() {
  const plan = els.fPlan.value.trim();
  if (!plan) { toast('กรุณากรอกกิจกรรม/แผนงานก่อน', 'err'); els.fPlan.focus(); return; }

  if (els.fResult.value.trim()) {
    const ok = await confirmDialog('มีข้อความในช่องผลการปฏิบัติงานอยู่แล้ว ต้องการให้ AI เขียนทับหรือไม่?', { okLabel: 'เขียนทับ' });
    if (!ok) return;
  }

  els.btnAi.disabled = true;
  els.aiStatus.textContent = 'กำลังให้ AI ช่วยเขียน...';
  try {
    const out = await api('ai.generate', {
      date: els.fDate.value || todayIso(),
      plan: plan,
      location: els.fLocation.value.trim(),
      target: els.fTarget.value.trim()
    });
    els.fResult.value = out.text;
    updateCharCount();
    els.aiStatus.textContent = out.cached ? 'ใช้ผลที่เคยสร้างไว้ (แคช)' : 'เขียนเสร็จแล้ว · ' + (out.latencyMs / 1000).toFixed(1) + ' วินาที';
  } catch (e) {
    els.aiStatus.textContent = '';
    toast(e.message, 'err');
  } finally {
    els.btnAi.disabled = false;
  }
}

/* ---------------- history ---------------- */

async function loadHistory(reset) {
  if (reset) {
    state.list.offset = 0;
    state.list.items = [];
  }
  const scope = state.user.role === 'admin' ? (els.hScope.value || 'all') : 'me';
  state.scope = scope;

  els.btnMore.disabled = true;
  try {
    const out = await api('reports.list', {
      scope: scope,
      q: els.hQ.value.trim(),
      from: els.hFrom.value || '',
      to: els.hTo.value || '',
      limit: state.list.limit,
      offset: state.list.offset
    });
    state.list.items = state.list.items.concat(out.items || []);
    state.list.total = out.total || 0;
    state.list.hasMore = !!out.hasMore;
    renderHistory();
  } catch (e) {
    toast(e.message, 'err');
  } finally {
    els.btnMore.disabled = false;
  }
}

function renderHistory() {
  clear(els.hList);
  const items = state.list.items;
  els.hSummary.textContent = 'พบ ' + state.list.total.toLocaleString('th-TH') + ' รายการ' +
    (state.scope === 'all' ? ' (ทุกคน)' : '');

  if (!items.length) {
    els.hList.appendChild(el('p', { class: 'muted', text: 'ยังไม่มีรายการ' }));
    els.btnMore.classList.add('hidden');
    return;
  }

  items.forEach(function (it) {
    const head = el('div', { class: 'item-head' }, [
      el('span', { class: 'date', text: fmtThaiDate(it.workDate) }),
      el('span', { text: (it.location || '-') + (state.scope === 'all' ? ' · ' + it.owner : '') })
    ]);

    const actions = el('div', { class: 'item-actions' }, [
      el('button', {
        class: 'btn ghost sm', type: 'button',
        onclick: function () { copyText(it); }
      }, ['คัดลอก']),
      el('button', {
        class: 'btn ghost sm', type: 'button',
        onclick: function () { startEdit(it); }
      }, ['แก้ไข']),
      el('button', {
        class: 'btn danger sm', type: 'button',
        onclick: function () { removeItem(it); }
      }, ['ลบ'])
    ]);

    els.hList.appendChild(el('div', { class: 'item' }, [
      head,
      el('div', { class: 'item-title', text: it.plan }),
      el('div', { class: 'item-body', text: it.result }),
      it.target ? el('div', { class: 'item-meta', text: 'เป้าหมาย: ' + it.target }) : null,
      el('div', { class: 'item-meta', text: 'แก้ไขล่าสุด: ' + (fmtDateTime(it.updatedAt) || '-') }),
      actions
    ]));
  });

  els.btnMore.classList.toggle('hidden', !state.list.hasMore);
}

function startEdit(it) {
  els.fDate.value = it.workDate;
  els.fPlan.value = it.plan;
  els.fLocation.value = it.location;
  els.fTarget.value = it.target;
  els.fResult.value = it.result;
  updateCharCount();
  setEditing(it.id);
  switchTab('report');
  els.fPlan.focus();
  toast('แก้ไขรายงานวันที่ ' + fmtThaiDate(it.workDate));
}

async function removeItem(it) {
  const ok = await confirmDialog('ลบรายงาน "' + it.plan + '" ใช่หรือไม่?\n(ข้อมูลจะถูกทำเครื่องหมายว่าลบ ไม่ได้หายจากชีตทันที)', {
    okLabel: 'ลบ', danger: true
  });
  if (!ok) return;
  try {
    await api('reports.delete', { id: it.id });
    state.list.items = state.list.items.filter(function (x) { return x.id !== it.id; });
    state.list.total = Math.max(state.list.total - 1, 0);
    renderHistory();
    toast('ลบรายงานแล้ว', 'ok');
    if (state.editingId === it.id) clearForm();
  } catch (e) {
    toast(e.message, 'err');
  }
}

function copyText(it) {
  const text = [fmtThaiDate(it.workDate), it.plan, it.result].filter(Boolean).join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast('คัดลอกแล้ว', 'ok'); });
  } else {
    const ta = el('textarea', { style: 'position:fixed;opacity:0' });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('คัดลอกแล้ว', 'ok'); } catch (e) { toast('คัดลอกไม่สำเร็จ', 'err'); }
    document.body.removeChild(ta);
  }
}

/* ---------------- password ---------------- */

function openChangePassword(forced) {
  const current = el('input', { type: 'password', autocomplete: 'current-password', placeholder: 'รหัสผ่านปัจจุบัน' });
  const next = el('input', { type: 'password', autocomplete: 'new-password', placeholder: 'อย่างน้อย 8 ตัวอักษร' });
  const confirm = el('input', { type: 'password', autocomplete: 'new-password', placeholder: 'พิมพ์อีกครั้ง' });
  const msg = el('p', { class: 'error' });

  openModal({
    title: forced ? 'ตั้งรหัสผ่านใหม่' : 'เปลี่ยนรหัสผ่าน',
    sticky: !!forced,
    body: el('div', {}, [current, next, confirm, msg]),
    actions: [
      forced ? null : { label: 'ยกเลิก', kind: 'ghost', onClick: closeModal },
      {
        label: 'บันทึก', kind: 'primary',
        onClick: async function () {
          msg.textContent = '';
          if (next.value.length < 8) { msg.textContent = 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร'; return; }
          if (next.value !== confirm.value) { msg.textContent = 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน'; return; }
          try {
            await api('auth.changePassword', {
              currentPassword: current.value,
              newPassword: next.value
            });
            state.user.mustChange = false;
            closeModal();
            toast('เปลี่ยนรหัสผ่านแล้ว', 'ok');
          } catch (e) {
            msg.textContent = e.message;
          }
        }
      }
    ].filter(Boolean)
  });
}

/* ---------------- wiring ---------------- */

function wireApp() {
  els.btnLogout.addEventListener('click', logout);
  els.userChip.addEventListener('click', function () { openChangePassword(false); });

  els.tabs.addEventListener('click', function (ev) {
    const btn = ev.target.closest('.tab');
    if (btn) switchTab(btn.dataset.tab);
  });

  els.btnSave.addEventListener('click', saveReport);
  els.btnCancelEdit.addEventListener('click', function () { clearForm(); toast('ยกเลิกการแก้ไข'); });
  els.btnAi.addEventListener('click', aiGenerate);
  els.fResult.addEventListener('input', updateCharCount);

  els.btnRefresh.addEventListener('click', function () { loadHistory(true); });
  els.btnMore.addEventListener('click', function () {
    state.list.offset = state.list.items.length;
    loadHistory(false);
  });
  els.hScope.addEventListener('change', function () { loadHistory(true); });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && $('#modalRoot') && $('#modalRoot').children.length && !state.user) closeModal();
  });

  initAdmin({ getUser: function () { return state.user; } });
}

document.addEventListener('DOMContentLoaded', function () {
  wireLogin();
  wireApp();
  boot();
});
