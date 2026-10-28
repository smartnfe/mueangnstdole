/** DOM / UI helpers แบบไม่ใช้ innerHTML กับข้อมูลผู้ใช้ */

export function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;      // เฉพาะสตริงคงที่ในโค้ด
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === 'dataset') {
        Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; });
      } else if (v === true) node.setAttribute(k, '');
      else node.setAttribute(k, v);
    });
  }
  (children || []).forEach(function (c) {
    if (c === null || c === undefined || c === false) return;
    node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  });
  return node;
}

export function clear(node) {
  while (node && node.firstChild) node.removeChild(node.firstChild);
}

export function $(sel) { return document.querySelector(sel); }
export function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

let toastTimer = null;
export function toast(msg, kind) {
  const box = $('#toast');
  if (!box) return;
  box.textContent = msg;
  box.className = 'toast ' + (kind || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { box.className = 'toast hidden'; }, 3200);
}

let onCloseModal = null;

export function openModal(opts) {
  const root = $('#modalRoot');
  clear(root);
  const bodyNode = typeof opts.body === 'string'
    ? el('div', { html: opts.body })
    : (opts.body || el('div'));

  const actions = el('div', { class: 'modal-actions' }, (opts.actions || []).map(function (a) {
    return el('button', {
      class: 'btn ' + (a.kind || 'ghost'),
      type: 'button',
      onclick: function () { a.onClick && a.onClick(); }
    }, [a.label]);
  }));

  const box = el('div', { class: 'modal' }, [
    opts.title ? el('h3', { text: opts.title }) : null,
    bodyNode,
    actions
  ]);

  const bg = el('div', {
    class: 'modal-bg',
    onclick: function (ev) { if (ev.target === bg && !opts.sticky) closeModal(); }
  }, [box]);

  root.appendChild(bg);
  onCloseModal = opts.onClose || null;
  const first = box.querySelector('input, textarea, select');
  if (first) setTimeout(function () { first.focus(); }, 40);
  return { close: closeModal, node: box };
}

export function closeModal() {
  const root = $('#modalRoot');
  if (root) clear(root);
  if (onCloseModal) { const f = onCloseModal; onCloseModal = null; f(); }
}

export function confirmDialog(message, opts) {
  opts = opts || {};
  return new Promise(function (resolve) {
    openModal({
      title: opts.title || 'ยืนยัน',
      body: el('p', { text: message, style: 'margin:0;white-space:pre-wrap' }),
      onClose: function () { resolve(false); },
      actions: [
        { label: 'ยกเลิก', kind: 'ghost', onClick: function () { closeModal(); } },
        {
          label: opts.okLabel || 'ยืนยัน', kind: opts.danger ? 'danger' : 'primary',
          onClick: function () { onCloseModal = null; clear($('#modalRoot')); resolve(true); }
        }
      ]
    });
  });
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export function fmtThaiDate(iso) {
  if (!iso) return '-';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso);
  const y = Number(m[1]) + 543;
  const mi = Number(m[2]) - 1;
  return Number(m[3]) + ' ' + (THAI_MONTHS[mi] || m[2]) + ' ' + y;
}

export function fmtDateTime(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const pad = function (n) { return ('0' + n).slice(-2); };
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + (d.getFullYear() + 543) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

export function todayIso() {
  const d = new Date();
  const pad = function (n) { return ('0' + n).slice(-2); };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
