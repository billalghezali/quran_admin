/* ═══════════════════════════════════════════════════════════════════════
   نظام إدارة المدرسة القرآنية v2.0 — app.js
   ═══════════════════════════════════════════════════════════════════════ */

// ── Utils ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// أرقام عربية
const toAr = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

// التاريخ الهجري
function getHijri(date = new Date()) {
  return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    day:'numeric', month:'long', year:'numeric'
  }).format(date);
}

// التاريخ الميلادي بالعربية
function getMiladi(date = new Date()) {
  return date.toLocaleDateString('ar-DZ', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// تحديث شريط التاريخ
function updateDates() {
  const el = $('topbar-dates');
  if (!el) return;
  el.innerHTML = `
    <span>📅 ${getMiladi()}</span>
    <span style="color:var(--border2)">|</span>
    <span>🌙 ${getHijri()}</span>`;
}
updateDates();
setInterval(updateDates, 60000);

// ── Toast ──────────────────────────────────────────────────────────────
let _toastT;
function toast(msg, type = 'success') {
  clearTimeout(_toastT);
  const t = $('toast');
  t.innerHTML = `<span>${type==='success'?'✓':'✕'}</span> ${msg}`;
  t.className = `toast ${type}`;
  _toastT = setTimeout(() => t.classList.add('hidden'), 3000);
}

// ── Modal ──────────────────────────────────────────────────────────────
function openModal(title, html) {
  $('modal-title').textContent = title;
  $('modal-body').innerHTML = html;
  $('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  $('modal-overlay').classList.add('hidden');
  setTimeout(() => { $('modal-body').innerHTML = ''; }, 200);
}
$('modal-close').addEventListener('click', closeModal);
$('modal-overlay').addEventListener('click', e => { if (e.target === $('modal-overlay')) closeModal(); });

// ── Print Preview ──────────────────────────────────────────────────────
function doPrint(html, title = '') {
  // استخراج العنوان من h1 إذا لم يُعطَ
  if (!title) {
    const m = html.match(/<h1[^>]*>(.*?)<\/h1>/);
    title = m ? m[1] : 'معاينة قبل الطباعة';
  }
  // إنشاء نافذة معاينة
  const overlay = document.createElement('div');
  overlay.id = '_preview_overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(15,25,40,.75);
    backdrop-filter:blur(6px);
    display:flex;flex-direction:column;align-items:center;
    padding:20px;overflow-y:auto;
    animation:pgIn .25s ease;
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    width:100%;max-width:860px;
    background:#fff;border-radius:12px;
    box-shadow:0 20px 60px rgba(0,0,0,.4);
    overflow:hidden;
  `;

  // شريط الأدوات
  const toolbar = document.createElement('div');
  toolbar.style.cssText = `
    display:flex;align-items:center;justify-content:space-between;
    padding:14px 20px;
    background:#1a7a44;color:#fff;
    font-family:'Tajawal',sans-serif;
    direction:rtl;
  `;
  toolbar.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:18px">📄</span>
      <span style="font-size:15px;font-weight:700">${title}</span>
    </div>
    <div style="display:flex;gap:10px">
      <button id="_prev_print" style="
        padding:8px 20px;border-radius:7px;border:none;cursor:pointer;
        background:#fff;color:#1a7a44;font-weight:700;font-size:13px;
        font-family:'Tajawal',sans-serif;
        display:flex;align-items:center;gap:6px;
        box-shadow:0 2px 8px rgba(0,0,0,.15);
        transition:all .2s;
      ">🖨️ طباعة</button>
      <button id="_prev_close" style="
        padding:8px 16px;border-radius:7px;border:1px solid rgba(255,255,255,.3);
        cursor:pointer;background:transparent;color:#fff;font-weight:600;
        font-size:13px;font-family:'Tajawal',sans-serif;transition:all .2s;
      ">✕ إغلاق</button>
    </div>
  `;

  // محتوى المعاينة
  const preview = document.createElement('div');
  preview.style.cssText = `
    padding:40px 50px;
    font-family:'Tajawal',sans-serif;
    direction:rtl;background:#fff;
    min-height:400px;
  `;
  preview.innerHTML = `
    <style>
      #_preview_overlay table{width:100%;border-collapse:collapse;margin-top:12px}
      #_preview_overlay thead th{background:#1a7a44;color:#fff;padding:10px 14px;text-align:right;font-size:13px;font-weight:700}
      #_preview_overlay tbody td{padding:9px 14px;border-bottom:1px solid #e5e9ef;font-size:13px}
      #_preview_overlay tbody tr:nth-child(even) td{background:#f4f9f6}
      #_preview_overlay .ph h1{font-size:22px;color:#1a7a44;margin-bottom:4px}
      #_preview_overlay .ph p{font-size:12px;color:#666}
      #_preview_overlay .ph{border-bottom:2px solid #1a7a44;padding-bottom:14px;margin-bottom:18px}
      #_preview_overlay .pf{margin-top:16px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e5e9ef;padding-top:12px}
    </style>
    ${html}
  `;

  box.appendChild(toolbar);
  box.appendChild(preview);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // أحداث
  document.getElementById('_prev_print').addEventListener('click', () => {
    $('print-area').innerHTML = html;
    window.print();
  });
  document.getElementById('_prev_close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // hover effect على زر الطباعة
  const pb = document.getElementById('_prev_print');
  pb.addEventListener('mouseenter', () => pb.style.transform = 'translateY(-1px)');
  pb.addEventListener('mouseleave', () => pb.style.transform = '');
}

// ── Session (Teacher Login) ────────────────────────────────────────────
let SESSION = { id: null, name: '', role: 'admin' }; // role: admin | teacher

async function initLogin() {
  const teachers = await window.api.getTeachers();
  const sel = $('login-who');
  teachers.forEach(t => {
    const o = document.createElement('option');
    o.value = `teacher_${t.id}`;
    o.textContent = `👨‍🏫 ${t.name}`;
    sel.appendChild(o);
  });

  $('login-btn').addEventListener('click', async () => {
    const val = sel.value;
    if (!val) return;

    if (val === 'admin') {
      const { has } = await window.api.hasPassword();
      if (!has) {
        // أول مرة — اطلب إنشاء كلمة سر
        showPasswordSetup();
      } else {
        showPasswordPrompt(teachers);
      }
    } else {
      const tid = Number(val.replace('teacher_', ''));
      const t = teachers.find(x => x.id === tid);
      SESSION = { id: tid, name: t.name, role: 'teacher' };
      startApp();
    }
  });
}

// ── شاشة إنشاء كلمة السر (أول مرة) ──────────────────────────────────
function showPasswordSetup() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:36px;width:380px;box-shadow:0 20px 60px rgba(0,0,0,.4);text-align:center;font-family:Tajawal,sans-serif;direction:rtl">
      <div style="font-size:48px;margin-bottom:12px">🔐</div>
      <h2 style="font-family:Amiri,serif;color:#1a7a44;margin-bottom:6px">إنشاء كلمة السر</h2>
      <p style="font-size:13px;color:#5a6a7e;margin-bottom:24px">أول مرة تدخل كمدير — حدد كلمة سر لحماية النظام</p>
      <input id="_pw1" type="password" placeholder="كلمة السر الجديدة" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:9px;font-size:15px;font-family:Tajawal,sans-serif;margin-bottom:10px;outline:none;text-align:center">
      <input id="_pw2" type="password" placeholder="تأكيد كلمة السر" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:9px;font-size:15px;font-family:Tajawal,sans-serif;margin-bottom:6px;outline:none;text-align:center">
      <div id="_pw_err" style="color:#e05050;font-size:12px;margin-bottom:12px;min-height:18px"></div>
      <button id="_pw_save" style="width:100%;padding:13px;border-radius:9px;border:none;background:#1a7a44;color:#fff;font-size:15px;font-weight:700;font-family:Tajawal,sans-serif;cursor:pointer">✓ حفظ كلمة السر</button>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#_pw1').focus();
  overlay.querySelector('#_pw_save').addEventListener('click', async () => {
    const p1 = overlay.querySelector('#_pw1').value.trim();
    const p2 = overlay.querySelector('#_pw2').value.trim();
    const err = overlay.querySelector('#_pw_err');
    if (!p1) { err.textContent = 'كلمة السر لا يمكن أن تكون فارغة'; return; }
    if (p1.length < 4) { err.textContent = 'كلمة السر يجب أن تكون ٤ أحرف على الأقل'; return; }
    if (p1 !== p2) { err.textContent = 'كلمتا السر غير متطابقتين'; return; }
    await window.api.setPassword(p1);
    overlay.remove();
    SESSION = { id: null, name: 'المدير', role: 'admin' };
    startApp();
    toast('✓ تم إنشاء كلمة السر بنجاح');
  });
}

// ── شاشة إدخال كلمة السر ─────────────────────────────────────────────
function showPasswordPrompt(teachers) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:36px;width:360px;box-shadow:0 20px 60px rgba(0,0,0,.4);text-align:center;font-family:Tajawal,sans-serif;direction:rtl">
      <div style="font-size:48px;margin-bottom:12px">🔑</div>
      <h2 style="font-family:Amiri,serif;color:#1a7a44;margin-bottom:6px">دخول المدير</h2>
      <p style="font-size:13px;color:#5a6a7e;margin-bottom:24px">أدخل كلمة السر للمتابعة</p>
      <input id="_pwi" type="password" placeholder="كلمة السر" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:9px;font-size:18px;font-family:Tajawal,sans-serif;margin-bottom:6px;outline:none;text-align:center;letter-spacing:4px">
      <div id="_pwi_err" style="color:#e05050;font-size:12px;margin-bottom:14px;min-height:18px"></div>
      <button id="_pwi_ok" style="width:100%;padding:13px;border-radius:9px;border:none;background:#1a7a44;color:#fff;font-size:15px;font-weight:700;font-family:Tajawal,sans-serif;cursor:pointer;margin-bottom:10px">→ دخول</button>
      <button id="_pwi_cancel" style="width:100%;padding:10px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#5a6a7e;font-size:13px;font-family:Tajawal,sans-serif;cursor:pointer">إلغاء</button>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#_pwi');
  input.focus();

  // الدخول بالضغط على Enter
  input.addEventListener('keydown', e => { if (e.key === 'Enter') overlay.querySelector('#_pwi_ok').click(); });

  overlay.querySelector('#_pwi_ok').addEventListener('click', async () => {
    const pwd = input.value;
    const err = overlay.querySelector('#_pwi_err');
    if (!pwd) { err.textContent = 'أدخل كلمة السر'; return; }
    const btn = overlay.querySelector('#_pwi_ok');
    btn.textContent = '⏳...'; btn.disabled = true;
    const res = await window.api.checkPassword(pwd);
    if (res.status === 'ok') {
      overlay.remove();
      SESSION = { id: null, name: 'المدير', role: 'admin' };
      startApp();
    } else {
      err.textContent = '❌ كلمة السر غير صحيحة';
      input.value = '';
      input.focus();
      input.style.borderColor = '#e05050';
      setTimeout(() => input.style.borderColor = '#e2e8f0', 1500);
      btn.textContent = '→ دخول'; btn.disabled = false;
    }
  });

  overlay.querySelector('#_pwi_cancel').addEventListener('click', () => overlay.remove());
}

function startApp() {
  $('login-screen').classList.add('hidden');
  $('app').classList.remove('hidden');

  $('session-name').textContent = SESSION.name;
  $('session-role').textContent = SESSION.role === 'admin' ? '🔑 مدير النظام' : '🎓 أستاذ';
  $('session-avatar').textContent = SESSION.role === 'admin' ? '🔑' : '👨‍🏫';

  // إخفاء قسم الأساتذة للأستاذ
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = SESSION.role === 'admin' ? '' : 'none';
  });

  // زر تغيير كلمة السر (مدير فقط)
  let cpBtn = $('_cp_btn');
  if (!cpBtn && SESSION.role === 'admin') {
    cpBtn = document.createElement('button');
    cpBtn.id = '_cp_btn';
    cpBtn.title = 'تغيير كلمة السر';
    cpBtn.style.cssText = 'background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.7);width:28px;height:28px;border-radius:6px;font-size:13px;cursor:pointer;transition:all .2s;flex-shrink:0';
    cpBtn.textContent = '⚙';
    cpBtn.addEventListener('mouseenter', () => cpBtn.style.background='rgba(255,255,255,.25)');
    cpBtn.addEventListener('mouseleave', () => cpBtn.style.background='rgba(255,255,255,.12)');
    cpBtn.addEventListener('click', showChangePassword);
    const si = $('sidebar-session');
    if (si) si.appendChild(cpBtn);
  }

  pages.dashboard();
  updateBadges();
}

function showChangePassword() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:36px;width:370px;box-shadow:0 20px 60px rgba(0,0,0,.4);text-align:center;font-family:Tajawal,sans-serif;direction:rtl">
      <div style="font-size:40px;margin-bottom:10px">🔐</div>
      <h2 style="font-family:Amiri,serif;color:#1a7a44;margin-bottom:20px">تغيير كلمة السر</h2>
      <input id="_cp_old" type="password" placeholder="كلمة السر الحالية" style="width:100%;padding:11px;border:2px solid #e2e8f0;border-radius:9px;font-size:14px;font-family:Tajawal,sans-serif;margin-bottom:10px;outline:none;text-align:center">
      <input id="_cp_new" type="password" placeholder="كلمة السر الجديدة" style="width:100%;padding:11px;border:2px solid #e2e8f0;border-radius:9px;font-size:14px;font-family:Tajawal,sans-serif;margin-bottom:10px;outline:none;text-align:center">
      <input id="_cp_conf" type="password" placeholder="تأكيد كلمة السر الجديدة" style="width:100%;padding:11px;border:2px solid #e2e8f0;border-radius:9px;font-size:14px;font-family:Tajawal,sans-serif;margin-bottom:6px;outline:none;text-align:center">
      <div id="_cp_err" style="color:#e05050;font-size:12px;margin-bottom:14px;min-height:18px"></div>
      <div style="display:flex;gap:10px">
        <button id="_cp_cancel" style="flex:1;padding:11px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#5a6a7e;font-size:13px;font-family:Tajawal,sans-serif;cursor:pointer">إلغاء</button>
        <button id="_cp_save" style="flex:2;padding:11px;border-radius:9px;border:none;background:#1a7a44;color:#fff;font-size:14px;font-weight:700;font-family:Tajawal,sans-serif;cursor:pointer">✓ حفظ</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#_cp_old').focus();
  overlay.querySelector('#_cp_cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#_cp_save').addEventListener('click', async () => {
    const old = overlay.querySelector('#_cp_old').value;
    const nw  = overlay.querySelector('#_cp_new').value.trim();
    const cf  = overlay.querySelector('#_cp_conf').value.trim();
    const err = overlay.querySelector('#_cp_err');
    if (!old) { err.textContent = 'أدخل كلمة السر الحالية'; return; }
    if (!nw || nw.length < 4) { err.textContent = 'كلمة السر الجديدة يجب أن تكون ٤ أحرف على الأقل'; return; }
    if (nw !== cf) { err.textContent = 'كلمتا السر غير متطابقتين'; return; }
    const res = await window.api.checkPassword(old);
    if (res.status !== 'ok') { err.textContent = '❌ كلمة السر الحالية غير صحيحة'; return; }
    await window.api.setPassword(nw);
    overlay.remove();
    toast('✓ تم تغيير كلمة السر بنجاح');
  });
}

$('btn-logout').addEventListener('click', () => {
  SESSION = { id: null, name: '', role: 'admin' };
  $('app').classList.add('hidden');
  $('login-screen').classList.remove('hidden');
  $('login-who').value = '';
  currentPage = 'dashboard';
});

// ── Router ─────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:'لوحة التحكم', students:'الطلاب',
  teachers:'الأساتذة', memorization:'تسجيل الحفظ',
  attendance:'الحضور والغياب', reports:'التقارير'
};
const pages = {};
let currentPage = 'dashboard';

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.page;
    if (name === currentPage) return;
    currentPage = name;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    $(`page-${name}`).classList.add('active');
    $('topbar-title').textContent = PAGE_TITLES[name] || '';
    pages[name]?.();
  });
});

$('btn-refresh').addEventListener('click', () => {
  $('btn-refresh').style.transform = 'rotate(360deg)';
  setTimeout(() => $('btn-refresh').style.transform = '', 400);
  pages[currentPage]?.();
});

async function updateBadges() {
  try {
    const stats = await window.api.getDashboardStats(SESSION.id);
    $('nb-students').textContent = toAr(stats.totalStudents);
    $('nb-teachers').textContent = toAr(stats.totalTeachers);
  } catch(e) {}
}

// ── Helpers ────────────────────────────────────────────────────────────
const badgeCls = g => ({ ممتاز:'bg', جيد:'bb', مقبول:'bo', ضعيف:'br' }[g] || 'bk');
const pctBadge = p => p >= 75 ? 'bg' : p >= 40 ? 'bo' : 'br';

function printBtn(label = '🖨️ طباعة') {
  return `<button class="btn btn-print btn-sm" id="_pb">${label}</button>`;
}

// ═══════════════════════════════════════════════════════════════════════
// 1. DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
pages.dashboard = async () => {
  const pg = $('page-dashboard');
  pg.innerHTML = `<div class="stats-grid" id="sg"></div>
    <div class="dash-grid">
      <div class="card"><div class="card-t"><div class="card-ico" style="background:var(--green-p)">🏆</div>أفضل الطلاب</div><div id="top"></div></div>
      <div class="card"><div class="card-t"><div class="card-ico" style="background:var(--blue-p)">📋</div>آخر جلسات الحفظ</div><div id="act"></div></div>
    </div>`;

  const d = await window.api.getDashboardStats(SESSION.id);
  updateBadges();

  $('sg').innerHTML = [
    { cls:'sc-green', ico:'👥', lbl:'الطلاب',        val:d.totalStudents },
    { cls:'sc-blue',  ico:'🎓', lbl:'الأساتذة',      val:d.totalTeachers },
    { cls:'sc-gold',  ico:'✅', lbl:'حضور اليوم',    val:d.todayPresent  },
    { cls:'sc-red',   ico:'📖', lbl:'جلسات الحفظ',   val:d.totalSessions },
  ].map(s => `<div class="stat-card ${s.cls}">
    <div class="stat-bg">${s.ico}</div>
    <div class="stat-lbl">${s.lbl}</div>
    <div class="stat-val">${toAr(s.val)}</div>
  </div>`).join('');

  $('top').innerHTML = d.topStudents.length
    ? d.topStudents.map((s,i) => `
        <div class="top-item">
          <div class="top-rank ${['r1','r2','r3'][i]||''}">${toAr(i+1)}</div>
          <div style="flex:1;font-weight:700">${s.name}</div>
          <span class="badge bg">${toAr(s.cnt)} سورة</span>
        </div>`).join('')
    : `<div class="empty"><div class="empty-ico">🎓</div><div class="empty-s">لا يوجد بيانات بعد</div></div>`;

  $('act').innerHTML = d.recentActivity.length
    ? d.recentActivity.map(r => `
        <div class="act-item">
          <div class="act-dot"></div>
          <div class="act-txt"><b>${r.student}</b> — سورة ${r.surah}</div>
          <span class="badge ${badgeCls(r.grade)}">${r.grade}</span>
        </div>`).join('')
    : `<div class="empty"><div class="empty-ico">📋</div><div class="empty-s">لا يوجد نشاطات</div></div>`;
};

// ═══════════════════════════════════════════════════════════════════════
// 2. TEACHERS (admin only)
// ═══════════════════════════════════════════════════════════════════════
pages.teachers = async () => {
  if (SESSION.role !== 'admin') { pages.dashboard(); return; }
  const pg = $('page-teachers');
  pg.innerHTML = `
    <div class="ph">
      <div><div class="ph-title">الأساتذة</div><div class="ph-sub">إدارة كادر التدريس</div></div>
      <div class="ph-actions">
        ${printBtn('🖨️ طباعة')}
        <button class="btn btn-primary" id="ba">＋ إضافة أستاذ</button>
      </div>
    </div>
    <div class="card">
      <div class="tb">
        <div class="sb"><span class="sb-ico">🔍</span><input class="inp" id="ts" placeholder="بحث..." style="padding-right:34px"></div>
      </div>
      <div id="tt"></div>
    </div>`;

  let teachers = [];
  const render = list => {
    $('tt').innerHTML = list.length ? `<div class="tw"><table>
      <thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>التخصص</th><th>الطلاب</th><th>إجراءات</th></tr></thead>
      <tbody>${list.map((t,i) => `<tr>
        <td><span class="badge bk">${toAr(i+1)}</span></td>
        <td><div class="td-name">${t.name}</div></td>
        <td>${t.phone||'—'}</td>
        <td>${t.specialization?`<span class="badge bb">${t.specialization}`:'—'}</td>
        <td><span class="badge bg">${toAr(t.student_count)} طالب</span></td>
        <td><div style="display:flex;gap:5px">
          <button class="btn btn-secondary btn-xs _et" data-id="${t.id}">✏️</button>
          <button class="btn btn-danger btn-xs _dt" data-id="${t.id}">🗑️</button>
        </div></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty"><div class="empty-ico">🎓</div><div class="empty-t">لا يوجد أساتذة</div></div>`;

    pg.querySelectorAll('._et').forEach(b => b.addEventListener('click', () => teacherModal(teachers.find(t=>t.id==b.dataset.id), load)));
    pg.querySelectorAll('._dt').forEach(b => b.addEventListener('click', () => delTeacher(b.dataset.id)));
  };

  const load = async () => { teachers = await window.api.getTeachers(); render(teachers); updateBadges(); };
  await load();

  $('ts').addEventListener('input', e => render(teachers.filter(t => t.name.includes(e.target.value))));
  $('ba').addEventListener('click', () => teacherModal(null, load));
  $('_pb').addEventListener('click', () => doPrint(`
    <div class="ph"><h1>قائمة الأساتذة</h1><p>المدرسة القرآنية — ${getMiladi()} | ${getHijri()}</p></div>
    <table><thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>التخصص</th><th>عدد الطلاب</th></tr></thead>
    <tbody>${teachers.map((t,i)=>`<tr><td>${i+1}</td><td>${t.name}</td><td>${t.phone||'—'}</td><td>${t.specialization||'—'}</td><td>${t.student_count}</td></tr>`, 'قائمة الأساتذة').join('')}</tbody></table>
    <div class="pf">الإجمالي: ${teachers.length} أستاذ</div>`));

  const delTeacher = async id => {
    if (!confirm('حذف هذا الأستاذ؟')) return;
    await window.api.deleteTeacher(Number(id)); toast('تم الحذف'); load();
  };
};

function teacherModal(data, onDone) {
  openModal(data ? 'تعديل الأستاذ' : 'إضافة أستاذ', `
    <div class="fg"><label>الاسم *</label><input class="inp" id="tn" value="${data?.name||''}" placeholder="الاسم الكامل"></div>
    <div class="fr">
      <div class="fg"><label>الهاتف</label><input class="inp" id="tp" value="${data?.phone||''}"></div>
      <div class="fg"><label>التخصص</label><input class="inp" id="ts2" value="${data?.specialization||''}" placeholder="حفظ وتجويد"></div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
      <button class="btn btn-secondary" id="_c">إلغاء</button>
      <button class="btn btn-primary" id="_s">💾 حفظ</button>
    </div>`);
  $('_c').addEventListener('click', closeModal);
  $('_s').addEventListener('click', async () => {
    const name = $('tn').value.trim();
    if (!name) return toast('الاسم مطلوب', 'error');
    data ? await window.api.updateTeacher({ id:data.id, name, phone:$('tp').value, specialization:$('ts2').value })
          : await window.api.addTeacher({ name, phone:$('tp').value, specialization:$('ts2').value });
    toast(data ? 'تم التحديث ✓' : 'تم الإضافة ✓'); closeModal(); onDone();
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 3. STUDENTS
// ═══════════════════════════════════════════════════════════════════════
pages.students = async () => {
  const pg = $('page-students');
  const isAdmin = SESSION.role === 'admin';
  pg.innerHTML = `
    <div class="ph">
      <div>
        <div class="ph-title">${isAdmin ? 'كل الطلاب' : `طلاب الأستاذ: ${SESSION.name}`}</div>
        <div class="ph-sub">${isAdmin ? 'عرض وإدارة جميع الطلاب' : 'مجموعتك فقط'}</div>
      </div>
      <div class="ph-actions">
        ${printBtn('🖨️ قائمة')}
        ${isAdmin ? '<button class="btn btn-primary" id="_as">＋ إضافة طالب</button>' : ''}
      </div>
    </div>
    <div class="card">
      <div class="tb">
        <div class="sb"><span class="sb-ico">🔍</span><input class="inp" id="_sq" placeholder="ابحث عن طالب..." style="padding-right:34px"></div>
        ${isAdmin ? `<select class="inp" id="_ft" style="width:auto;min-width:150px"><option value="">كل الأساتذة</option></select>` : ''}
      </div>
      <div id="_st"></div>
    </div>`;

  let students = [], teachers = [];

  const render = list => {
    $('_st').innerHTML = list.length ? `<div class="tw"><table>
      <thead><tr><th>#</th><th>الطالب</th><th>تاريخ الميلاد</th>${isAdmin?'<th>الأستاذ</th>':''}<th>التقدم</th><th>السور</th><th>إجراءات</th></tr></thead>
      <tbody>${list.map((s,i) => `<tr>
        <td><span class="badge bk">${toAr(i+1)}</span></td>
        <td><div class="td-name">${s.name}</div>${s.phone?`<div class="td-sub">📞 ${s.phone}</div>`:''}</td>
        <td>${s.birthdate?`<span class="badge bk">📅 ${s.birthdate}</span>`:'—'}</td>
        ${isAdmin?`<td>${s.teacher_name?`<span class="badge bb">${s.teacher_name}</span>`:'—'}</td>`:''}
        <td><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill" style="width:${s.progress||0}%"></div></div><span class="prog-pct">${toAr(s.progress||0)}%</span></div></td>
        <td><span class="badge bg">${toAr(s.memorized_count)}</span></td>
        <td><div style="display:flex;gap:4px">
          <button class="btn btn-sm" style="background:var(--gold-p);color:var(--gold);border:1px solid rgba(200,152,42,.2)" data-id="${s.id}" class2="_vw">👁️</button>
          ${isAdmin?`<button class="btn btn-secondary btn-xs _es" data-id="${s.id}">✏️</button><button class="btn btn-danger btn-xs _ds" data-id="${s.id}">🗑️</button>`:''}
        </div></td>
      </tr>`).join('')}</tbody></table></div>`
    : `<div class="empty"><div class="empty-ico">👤</div><div class="empty-t">لا يوجد طلاب</div><div class="empty-s">${isAdmin?'أضف طالباً جديداً':'لا يوجد طلاب مسندون إليك'}</div></div>`;

    // bind view buttons
    pg.querySelectorAll('[class2="_vw"], .btn[data-id]').forEach(b => {
      if (!b.classList.contains('_es') && !b.classList.contains('_ds'))
        b.addEventListener('click', () => openProfile(b.dataset.id));
    });
    pg.querySelectorAll('._es').forEach(b => b.addEventListener('click', () => studentModal(students.find(s=>s.id==b.dataset.id), teachers, load)));
    pg.querySelectorAll('._ds').forEach(b => b.addEventListener('click', () => delStudent(b.dataset.id)));
  };

  const filter = () => {
    const q = $('_sq').value.trim();
    const tid = isAdmin ? $('_ft')?.value : String(SESSION.id);
    render(students.filter(s =>
      (!q || s.name.includes(q) || (s.teacher_name||'').includes(q)) &&
      (!tid || String(s.teacher_id) === tid)
    ));
  };

  const load = async () => {
    [students, teachers] = await Promise.all([window.api.getStudents(), window.api.getTeachers()]);
    if (isAdmin && $('_ft')) {
      $('_ft').innerHTML = '<option value="">كل الأساتذة</option>' + teachers.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
    }
    filter();
    updateBadges();
  };
  await load();

  $('_sq').addEventListener('input', filter);
  $('_ft')?.addEventListener('change', filter);
  $('_as')?.addEventListener('click', () => studentModal(null, teachers, load));
  $('_pb').addEventListener('click', () => {
    const visible = students.filter(s => !SESSION.id || s.teacher_id == SESSION.id);
    doPrint(`
      <div class="ph"><h1>قائمة الطلاب${!isAdmin?' — '+SESSION.name:''}</h1><p>المدرسة القرآنية — ${getMiladi()} | ${getHijri()}</p></div>
      <table><thead><tr><th>#</th><th>الاسم</th><th>تاريخ الميلاد</th><th>الأستاذ</th><th>السور</th><th>التقدم</th><th>الالتحاق</th></tr></thead>
      <tbody>${visible.map((s,i)=>`<tr><td>${i+1}</td><td>${s.name}</td><td>${s.birthdate||'—'}</td><td>${s.teacher_name||'—'}</td><td>${s.memorized_count}/114</td><td>${s.progress||0}%</td><td>${s.enrollment_date||'—'}</td></tr>`, 'قائمة الطلاب').join('')}</tbody></table>
      <div class="pf">الإجمالي: ${visible.length} طالب — متوسط التقدم: ${visible.length?Math.round(visible.reduce((a,s)=>a+(s.progress||0),0)/visible.length):0}%</div>`);
  });

  const delStudent = async id => {
    if (!confirm('حذف هذا الطالب وكل بياناته؟')) return;
    await window.api.deleteStudent(Number(id)); toast('تم الحذف'); load();
  };
};

function studentModal(data, teachers, onDone) {
  const opts = teachers.map(t=>`<option value="${t.id}" ${data?.teacher_id==t.id?'selected':''}>${t.name}</option>`).join('');
  openModal(data ? 'تعديل الطالب' : 'إضافة طالب', `
    <!-- ── معلومات الطالب ── -->
    <div style="background:var(--surface2);border-radius:var(--r-sm);padding:14px 16px;margin-bottom:14px;border:1px solid var(--border)">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px">👤 معلومات الطالب</div>
      <div class="fg"><label>الاسم الكامل *</label><input class="inp" id="_sn" value="${data?.name||''}" placeholder="أدخل الاسم الكامل للطالب"></div>
      <div class="fr">
        <div class="fg"><label>تاريخ الميلاد</label><input class="inp" type="date" id="_sb" value="${data?.birthdate||''}"></div>
        <div class="fg"><label>تاريخ الالتحاق</label><input class="inp" type="date" id="_sd" value="${data?.enrollment_date||new Date().toISOString().split('T')[0]}"></div>
      </div>
      <div class="fg" style="margin:0"><label>الأستاذ المشرف</label><select class="inp" id="_st2"><option value="">— بدون أستاذ —</option>${opts}</select></div>
    </div>

    <!-- ── بيانات ولي الأمر ── -->
    <div style="background:var(--blue-p);border-radius:var(--r-sm);padding:14px 16px;border:1px solid rgba(58,123,213,.15)">
      <div style="font-size:11px;font-weight:700;color:var(--blue);letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px">👨‍👩‍👦 بيانات ولي الأمر</div>
      <div class="fr">
        <div class="fg"><label>اسم ولي الأمر</label><input class="inp" id="_pn" value="${data?.parent_name||''}" placeholder="الاسم الكامل"></div>
        <div class="fg"><label>صلة القرابة</label>
          <select class="inp" id="_pr">
            <option value="">— اختر —</option>
            <option value="الأب"   ${data?.parent_relation==='الأب'  ?'selected':''}>الأب</option>
            <option value="الأم"   ${data?.parent_relation==='الأم'  ?'selected':''}>الأم</option>
            <option value="الأخ"   ${data?.parent_relation==='الأخ'  ?'selected':''}>الأخ</option>
            <option value="الأخت"  ${data?.parent_relation==='الأخت' ?'selected':''}>الأخت</option>
            <option value="العم"   ${data?.parent_relation==='العم'  ?'selected':''}>العم</option>
            <option value="الجد"   ${data?.parent_relation==='الجد'  ?'selected':''}>الجد</option>
            <option value="ولي أمر"${data?.parent_relation==='ولي أمر'?'selected':''}>ولي أمر</option>
          </select>
        </div>
      </div>
      <div class="fg" style="margin:0"><label>رقم هاتف ولي الأمر</label><input class="inp" id="_pp2" value="${data?.parent_phone||''}" placeholder="0xx xxx xxxx"></div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
      <button class="btn btn-secondary" id="_c">إلغاء</button>
      <button class="btn btn-primary" id="_sv">💾 حفظ</button>
    </div>`);
  $('_c').addEventListener('click', closeModal);
  $('_sv').addEventListener('click', async () => {
    const name = $('_sn').value.trim();
    if (!name) return toast('الاسم مطلوب', 'error');
    const d = { name, birthdate:$('_sb')?.value||'', teacher_id:$('_st2').value||null, enrollment_date:$('_sd').value,
      parent_name:$('_pn').value, parent_phone:$('_pp2').value, parent_relation:$('_pr').value };
    data ? await window.api.updateStudent({...d,id:data.id}) : await window.api.addStudent(d);
    toast(data?'تم التحديث ✓':'تم الإضافة ✓'); closeModal(); onDone();
  });
}

// ── Student Profile ────────────────────────────────────────────────────
async function openProfile(id) {
  const data = await window.api.getStudentById(Number(id));
  const {student:s, memorized, attendance} = data;
  const mMap = {};
  memorized.forEach(m => mMap[m.surah_id] = m);
  const present = attendance.filter(a=>a.status==='حاضر').length;
  const attPct = attendance.length ? Math.round(present*100/attendance.length) : 0;
  const totalAyahs = data.totalAyahs || 0;
  const pct = Math.round(totalAyahs*100/6236);

  // achievements
  // حساب العمر من تاريخ الميلاد
  let ageStr = '';
  if (s.birthdate) {
    const diff = new Date() - new Date(s.birthdate);
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    ageStr = `${toAr(age)} سنة`;
  }

  const ach = [];
  if (memorized.length >= 10)  ach.push('🌟 حفظ ١٠ سور');
  if (memorized.length >= 30)  ach.push('🏅 حفظ ٣٠ سورة');
  if (memorized.length >= 114) ach.push('🏆 ختم القرآن الكريم');
  if (memorized.filter(m=>m.grade==='ممتاز').length >= 10) ach.push('💎 عشرة سور بامتياز');
  if (attPct >= 90) ach.push('✅ مثالي في الحضور');

  openModal(`ملف الطالب: ${s.name}`, `
    <div class="prof-head">
      <div class="prof-av">👤</div>
      <div style="flex:1">
        <div class="prof-name">${s.name}</div>
        <div class="prof-meta">
          ${s.birthdate?`تاريخ الميلاد: ${s.birthdate} &nbsp;|&nbsp; `:''}
          ${s.teacher_name?`الأستاذ: ${s.teacher_name}`:''}
        </div>
        ${ach.length?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">${ach.map(a=>`<span class="ach">${a}</span>`).join('')}</div>`:''}
      </div>
    </div>

    ${(s.parent_name||s.parent_phone) ? `
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:14px">
      <div style="width:42px;height:42px;border-radius:50%;background:var(--blue-p);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">👨‍👩‍👦</div>
      <div style="flex:1">
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">ولي الأمر</div>
        <div style="font-weight:700;font-size:14px;color:var(--text)">${s.parent_name||'—'} ${s.parent_relation?`<span class="badge bb" style="font-size:11px">${s.parent_relation}</span>`:''}</div>
        ${s.parent_phone?`<div style="font-size:13px;color:var(--text-dim);margin-top:2px">📞 ${s.parent_phone}</div>`:''}
      </div>

    </div>` : ''}

    <div class="prof-stats">
      <div class="pst"><div class="pst-v">${toAr(totalAyahs)}</div><div class="pst-l">آية محفوظة من ٦٢٣٦</div></div>
      <div class="pst"><div class="pst-v">${toAr(pct)}%</div><div class="pst-l">نسبة الإتمام</div></div>
      <div class="pst"><div class="pst-v">${toAr(attPct)}%</div><div class="pst-l">نسبة الحضور</div></div>
    </div>


    ${memorized.length ? `
    <div class="sec-t">📖 سجل الحفظ</div>
    <div class="tw" style="margin-bottom:16px"><table>
      <thead><tr><th>السورة</th><th>الآيات</th><th>الجزء</th><th>التقييم</th><th>التاريخ</th><th></th></tr></thead>
      <tbody>${memorized.map(m=>{
        const from=m.ayah_from||1, to=m.ayah_to||m.ayah_count;
        const isFull=from===1&&to===m.ayah_count;
        const cnt=to-from+1;
        return `<tr>
          <td><b>${m.surah_name}</b></td>
          <td>${isFull
            ?'<span class="badge bg">كاملة ✓</span>'
            :`<span class="badge bb">الآية ${toAr(from)} — ${toAr(to)}</span> <span style="font-size:11px;color:var(--text-muted)">(${toAr(cnt)} آية)</span>`}
          </td>
          <td><span class="badge bk">ج${toAr(m.juz)}</span></td>
          <td><span class="badge ${badgeCls(m.grade)}">${m.grade}</span></td>
          <td>${m.date}</td>
          <td><button class="btn btn-danger btn-xs _dm" data-mid="${m.id}" data-sid="${s.id}">🗑️</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>` : ''}

    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-print btn-sm" id="_pp">🖨️ طباعة الملف</button>
    </div>`);

  document.querySelectorAll('._dm').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('حذف هذا السجل؟')) return;
    await window.api.deleteMemorization(Number(b.dataset.mid));
    toast('تم الحذف'); closeModal(); openProfile(b.dataset.sid);
  }));

  $('_pp')?.addEventListener('click', () => doPrint(`
    <div class="ph"><h1>ملف الطالب: ${s.name}</h1>
    <p>${s.teacher_name?'الأستاذ: '+s.teacher_name+' — ':''} ${getMiladi()} | ${getHijri()}</p></div>
    <p style="margin:14px 0;font-size:13px">
      <b>السور المحفوظة:</b> ${memorized.length}/114 &nbsp;|&nbsp;
      <b>التقدم:</b> ${pct}% &nbsp;|&nbsp;
      <b>الحضور:</b> ${attPct}%
    </p>
    <table><thead><tr><th>#</th><th>السورة</th><th>الجزء</th><th>التقييم</th><th>التاريخ</th></tr></thead>
    <tbody>${memorized.map((m,i)=>`<tr><td>${i+1}</td><td>${m.surah_name}</td><td>${m.juz}</td><td>${m.grade}</td><td>${m.date}</td></tr>`, 'ملف الطالب').join('')}</tbody></table>`));
}

// ═══════════════════════════════════════════════════════════════════════
// 4. MEMORIZATION
// ═══════════════════════════════════════════════════════════════════════
pages.memorization = async () => {
  const pg = $('page-memorization');
  pg.innerHTML = `
    <div class="ph"><div><div class="ph-title">تسجيل الحفظ</div><div class="ph-sub">جلسات الحفظ اليومية</div></div></div>
    <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:18px">
      <div class="card">
        <div class="card-t">👤 اختيار الطالب</div>
        <div class="fg"><label>الطالب</label><select class="inp" id="_ms"><option value="">— اختر طالباً —</option></select></div>
        <div class="fg"><label>التاريخ</label><input class="inp" type="date" id="_md" value="${new Date().toISOString().split('T')[0]}"></div>
        <div id="_mi" class="hidden" style="margin-top:12px;padding:12px;background:var(--green-p);border-radius:9px;border:1px solid var(--green-p2)">
          <div style="font-weight:700;color:var(--green)" id="_mn"></div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:3px" id="_mst"></div>
          <div class="prog-wrap" style="margin-top:8px"><div class="prog-bar"><div class="prog-fill" id="_mpb" style="width:0%"></div></div><span class="prog-pct" id="_mpp">٠%</span></div>
        </div>
      </div>
      <div class="card">
        <div class="card-t">📖 تسجيل الجلسة</div>
        <div id="_mf"><div class="empty" style="padding:30px"><div class="empty-ico">👈</div><div class="empty-s">اختر طالباً أولاً</div></div></div>
      </div>
    </div>`;

  const [students, surahs] = await Promise.all([window.api.getStudents(), window.api.getSurahs()]);

  // فلتر حسب الأستاذ
  const myStudents = SESSION.id ? students.filter(s=>s.teacher_id==SESSION.id) : students;
  const sel = $('_ms');
  myStudents.forEach(s => sel.innerHTML += `<option value="${s.id}">${s.name} (${toAr(s.memorized_count)} سورة)</option>`);

  sel.addEventListener('change', () => {
    const id = Number(sel.value);
    if (!id) { $('_mi').classList.add('hidden'); $('_mf').innerHTML=`<div class="empty" style="padding:30px"><div class="empty-ico">👈</div><div class="empty-s">اختر طالباً أولاً</div></div>`; return; }
    const st = myStudents.find(s=>s.id==id);
    $('_mi').classList.remove('hidden');
    $('_mn').textContent = st.name;
    $('_mst').textContent = `${toAr(st.memorized_count)} سورة محفوظة من ${toAr(114)}`;
    $('_mpb').style.width = (st.progress||0)+'%';
    $('_mpp').textContent = toAr(st.progress||0)+'%';

    $('_mf').innerHTML = `
      <div class="fg"><label>السورة</label>
        <select class="inp" id="_msu"><option value="">— اختر السورة —</option>
          ${surahs.map(s=>`<option value="${s.id}" data-count="${s.ayah_count}">سورة ${s.name} — ${toAr(s.ayah_count)} آية (ج${toAr(s.juz)})</option>`).join('')}
        </select>
      </div>
      <div id="_ayah_wrap" style="display:none;margin-bottom:14px">
        <div style="background:var(--green-p);border:1px solid var(--green-p2);border-radius:10px;padding:14px">
          <div style="font-size:12px;font-weight:700;color:var(--green);margin-bottom:10px">📖 نطاق الآيات</div>
          <div class="fr" style="margin-bottom:10px">
            <div class="fg" style="margin:0">
              <label>من الآية</label>
              <input class="inp" type="text" id="_maf" value="١" inputmode="numeric" style="text-align:center;font-size:22px;font-weight:800;color:var(--green);font-family:'Tajawal',sans-serif;letter-spacing:2px">
            </div>
            <div class="fg" style="margin:0">
              <label>إلى الآية</label>
              <input class="inp" type="text" id="_mat" value="١" inputmode="numeric" style="text-align:center;font-size:22px;font-weight:800;color:var(--green);font-family:'Tajawal',sans-serif;letter-spacing:2px">
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div id="_ayah_info" style="font-size:12px;color:var(--text-dim)">—</div>
            <button class="btn btn-secondary btn-xs" id="_full_surah">السورة كاملة ↩</button>
          </div>
        </div>
      </div>
      <div class="fr">
        <div class="fg"><label>التقييم</label>
          <select class="inp" id="_mgr">
            <option value="ممتاز">⭐⭐⭐ ممتاز</option>
            <option value="جيد">⭐⭐ جيد</option>
            <option value="مقبول">⭐ مقبول</option>
            <option value="ضعيف">⚠️ ضعيف</option>
          </select>
        </div>
        <div class="fg"><label>ملاحظات</label><input class="inp" id="_mnt" placeholder="اختياري..."></div>
      </div>
      <button class="btn btn-primary" id="_msv" style="width:100%;justify-content:center;padding:13px;font-size:15px">💾 حفظ الجلسة</button>`;

    $('_msu').addEventListener('change', () => {
      const opt = $('_msu').selectedOptions[0];
      const total = Number(opt?.dataset.count || 0);
      if (!total) { $('_ayah_wrap').style.display='none'; return; }
      $('_ayah_wrap').style.display='block';
      $('_maf').value = toAr(1);
      $('_mat').value = toAr(total);
      refreshInfo(total);
    });

    // تحويل الأرقام العربية إلى غربية للحساب
    const fromAr = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    const getVal = id => Number(fromAr($('_maf') && id==='_maf' ? $('_maf').value : $('_mat')?.value) || 0);

    function refreshInfo(total) {
      const from = Number(fromAr($('_maf')?.value||'1'))||1;
      const to   = Number(fromAr($('_mat')?.value||'1'))||1;
      const cnt  = Math.max(0, to-from+1);
      const full = from===1 && to===total;
      if ($('_ayah_info')) $('_ayah_info').innerHTML =
        `<b style="color:var(--green)">${toAr(cnt)} آية</b> ${full
          ? '<span class="badge bg" style="margin-right:4px">✓ كاملة</span>'
          : `<span style="color:var(--text-muted)">من ${toAr(total)}</span>`}`;
    }

    setTimeout(()=>{
      const gT = () => Number($('_msu').selectedOptions[0]?.dataset.count||0);

      // عند الانتهاء من الكتابة فقط نتحقق من الحد
      function validateOnBlur(el, isFrom) {
        el.addEventListener('blur', () => {
          const total = gT();
          if (!total) return;
          let num = Number(fromAr(el.value)) || (isFrom ? 1 : total);
          num = Math.max(1, Math.min(num, total));
          el.value = toAr(num);
          // تحقق من أن "من" لا تتجاوز "إلى"
          const from = Number(fromAr($('_maf').value)||1);
          const to   = Number(fromAr($('_mat').value)||total);
          if (isFrom && from > to) $('_mat').value = toAr(Math.min(from, total));
          if (!isFrom && to < from) $('_maf').value = toAr(Math.max(1, to));
          refreshInfo(total);
        });
        // تحديث المعلومات أثناء الكتابة بدون تقييد
        el.addEventListener('input', () => refreshInfo(gT()));
      }

      validateOnBlur($('_maf'), true);
      validateOnBlur($('_mat'), false);

      $('_full_surah')?.addEventListener('click', () => {
        const t = gT();
        $('_maf').value = toAr(1);
        $('_mat').value = toAr(t);
        refreshInfo(t);
      });
    }, 50);

    $('_msv').addEventListener('click', async () => {
      const surah_id=Number($('_msu').value);
      if(!surah_id) return toast('اختر السورة أولاً','error');
      const ayah_from = Number(fromAr($('_maf')?.value||'1'))||1;
      const ayah_to   = Number(fromAr($('_mat')?.value||'0'))||0;
      if(ayah_to>0&&ayah_to<ayah_from) return toast('الآية النهائية يجب أن تكون أكبر من البداية','error');
      const btn=$('_msv'); btn.textContent='⏳ جاري الحفظ...'; btn.disabled=true;
      await window.api.addMemorization({student_id:id,surah_id,ayah_from,ayah_to,date:$('_md').value,grade:$('_mgr').value,notes:$('_mnt').value});
      toast('✓ تم تسجيل جلسة الحفظ بنجاح');
      btn.textContent='💾 حفظ الجلسة'; btn.disabled=false;
      $('_mnt').value='';
      const upd=await window.api.getStudents();
      const stu=upd.find(s=>s.id==id);
      if(stu){$('_mst').textContent=`${toAr(stu.total_ayahs||0)} آية محفوظة`;$('_mpb').style.width=(stu.progress||0)+'%';$('_mpp').textContent=toAr(stu.progress||0)+'%';}
    });
  });
};

// ═══════════════════════════════════════════════════════════════════════
// 5. ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════
pages.attendance = async () => {
  const pg = $('page-attendance');
  const today = new Date().toISOString().split('T')[0];
  pg.innerHTML = `
    <div class="ph">
      <div><div class="ph-title">الحضور والغياب</div><div class="ph-sub">التسجيل اليومي للحضور — ${getHijri()}</div></div>
      <div class="ph-actions">
        <input class="inp" type="date" id="_ad" value="${today}" style="width:170px">
        <button class="btn btn-primary" id="_sav">💾 حفظ</button>
        <button class="btn btn-print" id="_pr">🖨️</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
        <span style="color:var(--text-dim);font-size:13px">الإجمالي: <b id="_at" style="color:var(--text)">٠</b></span>
        <span style="color:var(--green);font-size:13px">حاضر: <b id="_ap">٠</b></span>
        <span style="color:var(--red);font-size:13px">غائب: <b id="_aa">٠</b></span>
        <span style="color:var(--gold);font-size:13px">بعذر: <b id="_ae">٠</b></span>
        <div style="margin-right:auto;display:flex;gap:7px">
          <button class="btn btn-secondary btn-sm" id="_allP">✅ الكل حاضر</button>
          <button class="btn btn-secondary btn-sm" id="_allA">❌ الكل غائب</button>
        </div>
      </div>
    </div>
    <div class="card"><div id="_al"></div></div>`;

  const state = {};
  let rows = [];

  const counts = () => {
    const v = Object.values(state);
    $('_at').textContent = toAr(v.length);
    $('_ap').textContent = toAr(v.filter(x=>x==='حاضر').length);
    $('_aa').textContent = toAr(v.filter(x=>x==='غائب').length);
    $('_ae').textContent = toAr(v.filter(x=>x==='بعذر').length);
  };

  const loadAtt = async () => {
    const date = $('_ad').value;
    // فلتر حسب الأستاذ
    let allRows = await window.api.getAttendanceByDate(date);
    rows = SESSION.id ? allRows.filter(r => r.teacher_id == SESSION.id) : allRows;
    Object.keys(state).forEach(k => delete state[k]);

    $('_al').innerHTML = rows.length ? rows.map(r => `
      <div class="att-row" id="ar${r.id}">
        <div style="font-weight:600">${r.name}</div>
        <div class="att-btns">
          <button class="att-btn ${r.status==='حاضر'?'P':''}" data-id="${r.id}" data-v="حاضر">✓ حاضر</button>
          <button class="att-btn ${r.status==='غائب'?'A':''}" data-id="${r.id}" data-v="غائب">✕ غائب</button>
          <button class="att-btn ${r.status==='بعذر'?'E':''}" data-id="${r.id}" data-v="بعذر">📋 بعذر</button>
        </div>
      </div>`).join('')
    : `<div class="empty"><div class="empty-ico">👤</div><div class="empty-t">لا يوجد طلاب</div></div>`;

    rows.forEach(r => { if (r.status) state[r.id] = r.status; });
    counts();

    $('_al').querySelectorAll('.att-btn').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.id, v = b.dataset.v;
      state[id] = v;
      document.querySelectorAll(`#ar${id} .att-btn`).forEach(x => x.className = 'att-btn');
      b.classList.add(v==='حاضر'?'P':v==='غائب'?'A':'E');
      counts();
    }));
  };

  await loadAtt();
  $('_ad').addEventListener('change', loadAtt);

  const markAll = v => {
    rows.forEach(r => {
      state[r.id] = v;
      document.querySelectorAll(`#ar${r.id} .att-btn`).forEach(x => x.className='att-btn');
      document.querySelector(`#ar${r.id} [data-v="${v}"]`)?.classList.add(v==='حاضر'?'P':v==='غائب'?'A':'E');
    });
    counts();
  };
  $('_allP').addEventListener('click', () => markAll('حاضر'));
  $('_allA').addEventListener('click', () => markAll('غائب'));

  $('_sav').addEventListener('click', async () => {
    const records = Object.entries(state).map(([id,status]) => ({id:Number(id),status}));
    await window.api.saveAttendance({ date:$('_ad').value, records });
    toast('✓ تم حفظ الحضور');
  });

  $('_pr').addEventListener('click', () => {
    const date = $('_ad').value;
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'}).format(new Date(date));
    doPrint(`
      <div class="ph"><h1>كشف الحضور${!SESSION.id?'':' — '+SESSION.name}</h1>
      <p>التاريخ: ${date} | الهجري: ${hijri}</p></div>
      <table><thead><tr><th>#</th><th>اسم الطالب</th><th>الحضور</th></tr></thead>
      <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.name}</td><td>${state[r.id]||'—'}</td></tr>`, 'كشف الحضور').join('')}</tbody></table>
      <div class="pf">حاضر: ${Object.values(state).filter(v=>v==='حاضر').length} | غائب: ${Object.values(state).filter(v=>v==='غائب').length} | بعذر: ${Object.values(state).filter(v=>v==='بعذر').length}</div>`);
  });
};

// ═══════════════════════════════════════════════════════════════════════
// 6. REPORTS
// ═══════════════════════════════════════════════════════════════════════
pages.reports = async () => {
  const pg = $('page-reports');
  pg.innerHTML = `<div class="ph"><div><div class="ph-title">التقارير</div><div class="ph-sub">تقرير شامل للأداء</div></div><button class="btn btn-print" id="_rp">🖨️ طباعة</button></div>
    <div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">⏳ جاري التحميل...</div>`;

  const data = (await window.api.getFullReport()).filter(r => !SESSION.id || r.teacher_id == SESSION.id);

  const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;

  pg.innerHTML = `
    <div class="ph">
      <div><div class="ph-title">التقارير</div><div class="ph-sub">${SESSION.id?'مجموعة: '+SESSION.name:'تقرير شامل لجميع الطلاب'}</div></div>
      <button class="btn btn-print" id="_rp">🖨️ طباعة</button>
    </div>
    <div class="stats-grid" style="margin-bottom:18px">
      <div class="stat-card sc-green"><div class="stat-bg">👥</div><div class="stat-lbl">الطلاب</div><div class="stat-val">${toAr(data.length)}</div></div>
      <div class="stat-card sc-gold"><div class="stat-bg">📊</div><div class="stat-lbl">متوسط الحفظ</div><div class="stat-val">${toAr(avg(data.map(r=>r.pct||0)))}%</div></div>
      <div class="stat-card sc-blue"><div class="stat-bg">🏆</div><div class="stat-lbl">أعلى نسبة</div><div class="stat-val">${toAr(data.length?data[0].pct||0:0)}%</div></div>
      <div class="stat-card sc-red"><div class="stat-bg">⚠️</div><div class="stat-lbl">يحتاجون متابعة</div><div class="stat-val">${toAr(data.filter(r=>(r.pct||0)<40).length)}</div></div>
    </div>
    <div class="card">
      <div class="tw"><table>
        <thead><tr><th>#</th><th>الطالب</th><th>الأستاذ</th><th>السور</th><th>الحفظ</th><th>الحضور</th><th>الحالة</th></tr></thead>
        <tbody>${data.map((r,i)=>{
          const attPct = r.total_days?Math.round(r.present_days*100/r.total_days):0;
          const [lbl,cls] = (r.pct||0)>=75?['ممتاز','bg']:(r.pct||0)>=40?['جيد','bo']:['يحتاج متابعة','br'];
          return `<tr>
            <td><span class="badge bk">${toAr(i+1)}</span></td>
            <td><div class="td-name">${r.name}</div></td>
            <td>${r.teacher_name?`<span class="badge bb">${r.teacher_name}</span>`:'—'}</td>
            <td><span class="badge bg">${toAr(r.memorized)}/١١٤</span></td>
            <td><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill" style="width:${r.pct||0}%"></div></div><span class="prog-pct">${toAr(r.pct||0)}%</span></div></td>
            <td><span class="badge ${pctBadge(attPct)}">${toAr(attPct)}%</span></td>
            <td><span class="badge ${cls}">${lbl}</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>`;

  $('_rp').addEventListener('click', () => doPrint(`
    <div class="ph"><h1>التقرير الشامل${SESSION.id?' — '+SESSION.name:''}</h1><p>${getMiladi()} | ${getHijri()}</p></div>
    <table><thead><tr><th>#</th><th>الطالب</th><th>الأستاذ</th><th>السور</th><th>الحفظ%</th><th>الحضور%</th><th>الحالة</th></tr></thead>
    <tbody>${data.map((r,i)=>{
      const attPct=r.total_days?Math.round(r.present_days*100/r.total_days):0;
      const s=(r.pct||0)>=75?'ممتاز':(r.pct||0)>=40?'جيد':'يحتاج متابعة';
      return `<tr><td>${i+1}</td><td>${r.name}</td><td>${r.teacher_name||'—'}</td><td>${r.memorized}/114</td><td>${r.pct||0}%</td><td>${attPct}%</td><td>${s}</td></tr>`;
    }).join('')}</tbody></table>
    <div class="pf">الإجمالي: ${data.length} طالب | متوسط الحفظ: ${avg(data.map(r=>r.pct||0))}%</div>`, 'التقرير الشامل'));
};

// ── BOOT ───────────────────────────────────────────────────────────────
initLogin();