import { api } from './api.js';
import { el, clear, $, toast, openModal, closeModal, confirmDialog, fmtDateTime } from './ui.js';

let ctx = { getUser: function () { return null; } };
let usersCache = [];

const THAI_MONTH_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export function initAdmin(context) {
  ctx = context || ctx;

  const btnAdd = $('#btnAddUser');
  if (btnAdd) btnAdd.addEventListener('click', function () { openUserForm(null); });

  const btnSearch = $('#btnUserSearch');
  if (btnSearch) btnSearch.addEventListener('click', adminShowUsers);

  const uSearch = $('#uSearch');
  if (uSearch) {
    uSearch.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); adminShowUsers(); }
    });
  }

  const selMonth = $('#sMonth');
  if (selMonth) {
    clear(selMonth);
    THAI_MONTH_FULL.forEach(function (name, i) {
      selMonth.appendChild(el('option', { value: String(i + 1), text: name }));
    });
    selMonth.value = String(new Date().getMonth() + 1);
  }
  const sYear = $('#sYear');
  if (sYear) sYear.value = String(new Date().getFullYear());

  const btnStats = $('#btnStats');
  if (btnStats) btnStats.addEventListener('click', adminShowStats);
}

/* ---------------- users ---------------- */

export async function adminShowUsers() {
  const box = $('#uList');
  if (!box) return;
  clear(box);
  box.appendChild(el('p', { class: 'muted', text: 'กำลังโหลด...' }));
  try {
    const out = await api('users.list', { q: ($('#uSearch') || {}).value || '' });
    usersCache = out.users || [];
    renderUsers(usersCache);
  } catch (e) {
    clear(box);
    box.appendChild(el('p', { class: 'error', text: e.message }));
  }
}

function renderUsers(list) {
  const box = $('#uList');
  clear(box);
  if (!list.length) {
    box.appendChild(el('p', { class: 'muted', text: 'ไม่พบสมาชิก' }));
    return;
  }

  const rows = list.map(function (u) {
    const me = ctx.getUser() && ctx.getUser().username === u.username;
    return el('tr', {}, [
      el('td', {}, [
        el('div', { text: u.name || u.username, style: 'font-weight:600' }),
        el('div', { class: 'muted', text: '@' + u.username + (me ? ' (คุณ)' : '') })
      ]),
      el('td', { text: u.position || '-' }),
      el('td', {}, [el('span', { class: 'tag ' + u.role, text: u.role === 'admin' ? 'ผู้ดูแล' : 'ผู้ใช้' })]),
      el('td', {}, [
        el('span', { class: 'tag ' + (u.active ? 'on' : 'off'), text: u.active ? 'ใช้งาน' : 'ปิด' }),
        u.mustChange ? el('div', { class: 'tag pending', text: 'รอตั้งรหัสใหม่', style: 'margin-top:4px' }) : null
      ]),
      el('td', {}, [el('span', { class: 'muted', text: u.lastLogin ? fmtDateTime(u.lastLogin) : 'ยังไม่เคยเข้า' })]),
      el('td', {}, [
        el('div', { class: 'btn-row' }, [
          el('button', { class: 'btn ghost sm', type: 'button', onclick: function () { openUserForm(u); } }, ['แก้ไข']),
          el('button', { class: 'btn ghost sm', type: 'button', onclick: function () { resetPassword(u); } }, ['รีเซ็ตรหัส']),
          el('button', {
            class: 'btn ghost sm', type: 'button',
            onclick: function () { toggleActive(u); }
          }, [u.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน']),
          el('button', {
            class: 'btn ghost sm', type: 'button',
            onclick: function () { toggleRole(u); }
          }, [u.role === 'admin' ? 'ลดเป็นผู้ใช้' : 'ตั้งเป็นแอดมิน'])
        ])
      ])
    ]);
  });

  const table = el('table', {}, [
    el('thead', {}, [el('tr', {}, [
      el('th', { text: 'ชื่อ-สกุล' }),
      el('th', { text: 'ตำแหน่ง' }),
      el('th', { text: 'สิทธิ์' }),
      el('th', { text: 'สถานะ' }),
      el('th', { text: 'เข้าใช้ล่าสุด' }),
      el('th', { text: '' })
    ])]),
    el('tbody', {}, rows)
  ]);

  box.appendChild(el('div', { class: 'table-wrap' }, [table]));
}

function openUserForm(user) {
  const isEdit = !!user;
  const fUser = el('input', {
    type: 'text', value: user ? user.username : '', placeholder: 'a-z 0-9 . _ -',
    disabled: isEdit
  });
  const fName = el('input', { type: 'text', value: user ? user.name : '', placeholder: 'เช่น สมชาย ใจดี' });
  const fPos = el('input', { type: 'text', value: user ? user.position : '', placeholder: 'เช่น นักวิชาการศึกษา' });
  const fPass = el('input', { type: 'password', placeholder: 'อย่างน้อย 8 ตัวอักษร', autocomplete: 'new-password' });
  const fRole = el('select', {}, [
    el('option', { value: 'user', text: 'ผู้ใช้ทั่วไป' }),
    el('option', { value: 'admin', text: 'ผู้ดูแลระบบ' })
  ]);
  fRole.value = user && user.role === 'admin' ? 'admin' : 'user';
  const msg = el('p', { class: 'error' });

  openModal({
    title: isEdit ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่',
    body: el('div', {}, [
      el('label', { text: 'ชื่อผู้ใช้ (ใช้ล็อกอิน)' }, [fUser]),
      el('label', { text: 'ชื่อ-สกุล' }, [fName]),
      el('label', { text: 'ตำแหน่ง' }, [fPos]),
      isEdit ? null : el('label', { text: 'รหัสผ่านเริ่มต้น' }, [fPass]),
      el('label', { text: 'สิทธิ์การใช้งาน' }, [fRole]),
      isEdit ? el('p', { class: 'muted', text: 'เปลี่ยนรหัสผ่านใช้ปุ่ม "รีเซ็ตรหัส"' }) : null,
      msg
    ].filter(Boolean)),
    actions: [
      { label: 'ยกเลิก', kind: 'ghost', onClick: closeModal },
      {
        label: isEdit ? 'บันทึก' : 'เพิ่มสมาชิก', kind: 'primary',
        onClick: async function () {
          msg.textContent = '';
          try {
            if (isEdit) {
              await api('users.update', {
                username: user.username,
                name: fName.value.trim(),
                position: fPos.value.trim()
              });
              if (fRole.value !== user.role) {
                await api('users.setRole', { username: user.username, role: fRole.value });
              }
              toast('บันทึกข้อมูลสมาชิกแล้ว', 'ok');
            } else {
              await api('users.create', {
                username: fUser.value.trim().toLowerCase(),
                name: fName.value.trim(),
                position: fPos.value.trim(),
                password: fPass.value,
                role: fRole.value
              });
              toast('เพิ่มสมาชิกแล้ว (ต้องตั้งรหัสใหม่เมื่อเข้าใช้ครั้งแรก)', 'ok');
            }
            closeModal();
            adminShowUsers();
          } catch (e) {
            msg.textContent = e.message;
          }
        }
      }
    ]
  });
}

async function resetPassword(u) {
  const ok = await confirmDialog('รีเซ็ตรหัสผ่านของ ' + (u.name || u.username) + '?\nระบบจะออกชั่วคราวให้ และผู้ใช้ต้องตั้งรหัสใหม่เมื่อเข้าใช้', {
    okLabel: 'รีเซ็ตรหัส', danger: true
  });
  if (!ok) return;
  try {
    const out = await api('users.resetPassword', { username: u.username });
    openModal({
      title: 'รหัสผ่านชั่วคราว',
      sticky: true,
      body: el('div', {}, [
        el('p', { class: 'muted', text: 'ส่งรหัสนี้ให้ ' + (u.name || u.username) + ' — แสดงครั้งเดียวเท่านั้น' }),
        el('div', { class: 'temp-pass', text: out.tempPassword }),
        el('p', { class: 'muted', text: 'เมื่อเข้าใช้ครั้งแรก ระบบจะบังคับให้ตั้งรหัสผ่านใหม่' })
      ]),
      actions: [
        {
          label: 'คัดลอก', kind: 'ghost', onClick: function () {
            navigator.clipboard.writeText(out.tempPassword).then(function () { toast('คัดลอกแล้ว', 'ok'); });
          }
        },
        { label: 'ปิด', kind: 'primary', onClick: closeModal }
      ]
    });
    adminShowUsers();
  } catch (e) {
    toast(e.message, 'err');
  }
}

async function toggleActive(u) {
  const next = !u.active;
  const ok = await confirmDialog((next ? 'เปิดใช้งาน ' : 'ปิดใช้งาน ') + (u.name || u.username) + '?', {
    okLabel: next ? 'เปิดใช้งาน' : 'ปิดใช้งาน', danger: !next
  });
  if (!ok) return;
  try {
    await api('users.setActive', { username: u.username, active: next });
    toast('อัปเดตสถานะแล้ว', 'ok');
    adminShowUsers();
  } catch (e) {
    toast(e.message, 'err');
  }
}

async function toggleRole(u) {
  const next = u.role === 'admin' ? 'user' : 'admin';
  const ok = await confirmDialog('เปลี่ยนสิทธิ์ของ ' + (u.name || u.username) + ' เป็น' +
    (next === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป') + '?', { okLabel: 'เปลี่ยนสิทธิ์' });
  if (!ok) return;
  try {
    await api('users.setRole', { username: u.username, role: next });
    toast('เปลี่ยนสิทธิ์แล้ว', 'ok');
    adminShowUsers();
  } catch (e) {
    toast(e.message, 'err');
  }
}

/* ---------------- stats ---------------- */

export async function adminShowStats() {
  const cards = $('#sCards');
  const body = $('#sBody');
  if (!cards || !body) return;

  clear(cards);
  clear(body);
  body.appendChild(el('p', { class: 'muted', text: 'กำลังโหลด...' }));

  try {
    const out = await api('stats.overview', {
      month: Number(($('#sMonth') || {}).value || (new Date().getMonth() + 1)),
      year: Number(($('#sYear') || {}).value || new Date().getFullYear())
    });

    clear(body);
    cards.appendChild(statCard(out.total, 'รายงานทั้งเดือน'));
    cards.appendChild(statCard(out.reportedUsers, 'คนที่ส่งรายงาน'));
    cards.appendChild(statCard(out.activeMembers, 'สมาชิกที่ใช้งาน'));
    cards.appendChild(statCard(out.missing, 'ยังไม่ส่งเดือนนี้'));

    body.appendChild(el('h3', { text: 'จำนวนรายงานรายคน' }));
    if (!out.byUser.length) {
      body.appendChild(el('p', { class: 'muted', text: 'ยังไม่มีข้อมูลในเดือนนี้' }));
    } else {
      const max = out.byUser[0].count || 1;
      out.byUser.forEach(function (u) {
        body.appendChild(el('div', { class: 'bar-row' }, [
          el('div', { class: 'name', text: u.name }),
          el('div', { class: 'bar-wrap' }, [
            el('div', { class: 'bar', style: 'width:' + Math.max((u.count / max) * 100, 3) + '%' })
          ]),
          el('div', { class: 'num', text: String(u.count) })
        ]));
      });
    }

    if (out.byDay.length) {
      body.appendChild(el('h3', { text: 'จำนวนรายงานรายวัน' }));
      const rows = out.byDay.map(function (d) {
        return el('tr', {}, [el('td', { text: d.date }), el('td', { text: String(d.count) })]);
      });
      body.appendChild(el('div', { class: 'table-wrap' }, [
        el('table', {}, [
          el('thead', {}, [el('tr', {}, [el('th', { text: 'วันที่' }), el('th', { text: 'จำนวน' })])]),
          el('tbody', {}, rows)
        ])
      ]));
    }
  } catch (e) {
    clear(body);
    body.appendChild(el('p', { class: 'error', text: e.message }));
  }
}

function statCard(value, label) {
  return el('div', { class: 'stat' }, [
    el('b', { text: String(value) }),
    el('span', { text: label })
  ]);
}
