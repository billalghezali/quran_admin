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

// ── Print ──────────────────────────────────────────────────────────────
function doPrint(html) { $('print-area').innerHTML = html; window.print(); }

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

  $('login-btn').addEventListener('click', () => {
    const val = sel.value;
    if (!val) return;
    if (val === 'admin') {
      SESSION = { id: null, name: 'المدير', role: 'admin' };
    } else {
      const tid = Number(val.replace('teacher_', ''));
      const t = teachers.find(x => x.id === tid);
      SESSION = { id: tid, name: t.name, role: 'teacher' };
    }
    startApp();
  });
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

  pages.dashboard();
  updateBadges();
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
    <div class="ph"><h1>قائمة الأساتذة</h1><p>المدرسة القرآنية — ${getMiladi()} — ${getHijri()}</p></div>
    <table><thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>التخصص</th><th>عدد الطلاب</th></tr></thead>
    <tbody>${teachers.map((t,i)=>`<tr><td>${i+1}</td><td>${t.name}</td><td>${t.phone||'—'}</td><td>${t.specialization||'—'}</td><td>${t.student_count}</td></tr>`).join('')}</tbody></table>
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
      <thead><tr><th>#</th><th>الطالب</th><th>العمر</th>${isAdmin?'<th>الأستاذ</th>':''}<th>التقدم</th><th>السور</th><th>إجراءات</th></tr></thead>
      <tbody>${list.map((s,i) => `<tr>
        <td><span class="badge bk">${toAr(i+1)}</span></td>
        <td><div class="td-name">${s.name}</div>${s.phone?`<div class="td-sub">📞 ${s.phone}</div>`:''}</td>
        <td>${s.age?`<span class="badge bk">${toAr(s.age)} سنة`:'—'}</td>
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
      <table><thead><tr><th>#</th><th>الاسم</th><th>العمر</th><th>الأستاذ</th><th>السور</th><th>التقدم</th><th>الالتحاق</th></tr></thead>
      <tbody>${visible.map((s,i)=>`<tr><td>${i+1}</td><td>${s.name}</td><td>${s.age||'—'}</td><td>${s.teacher_name||'—'}</td><td>${s.memorized_count}/114</td><td>${s.progress||0}%</td><td>${s.enrollment_date||'—'}</td></tr>`).join('')}</tbody></table>
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
    <div class="fg"><label>الاسم الكامل *</label><input class="inp" id="_sn" value="${data?.name||''}" placeholder="أدخل الاسم"></div>
    <div class="fr">
      <div class="fg"><label>العمر</label><input class="inp" type="number" id="_sa" value="${data?.age||''}" min="4" max="99"></div>
      <div class="fg"><label>هاتف ولي الأمر</label><input class="inp" id="_sp" value="${data?.phone||''}"></div>
    </div>
    <div class="fr">
      <div class="fg"><label>الأستاذ</label><select class="inp" id="_st2"><option value="">— بدون أستاذ —</option>${opts}</select></div>
      <div class="fg"><label>تاريخ الالتحاق</label><input class="inp" type="date" id="_sd" value="${data?.enrollment_date||new Date().toISOString().split('T')[0]}"></div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
      <button class="btn btn-secondary" id="_c">إلغاء</button>
      <button class="btn btn-primary" id="_sv">💾 حفظ</button>
    </div>`);
  $('_c').addEventListener('click', closeModal);
  $('_sv').addEventListener('click', async () => {
    const name = $('_sn').value.trim();
    if (!name) return toast('الاسم مطلوب', 'error');
    const d = { name, age:$('_sa').value||null, phone:$('_sp').value, teacher_id:$('_st2').value||null, enrollment_date:$('_sd').value };
    data ? await window.api.updateStudent({...d,id:data.id}) : await window.api.addStudent(d);
    toast(data?'تم التحديث ✓':'تم الإضافة ✓'); closeModal(); onDone();
  });
}

// ── Student Profile ────────────────────────────────────────────────────
async function openProfile(id) {
  const {student:s, memorized, attendance} = await window.api.getStudentById(Number(id));
  const surahs = await window.api.getSurahs();
  const mMap = {};
  memorized.forEach(m => mMap[m.surah_id] = m);
  const present = attendance.filter(a=>a.status==='حاضر').length;
  const attPct = attendance.length ? Math.round(present*100/attendance.length) : 0;
  const pct = Math.round(memorized.length*100/114);

  // achievements
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
          ${s.age?`العمر: ${toAr(s.age)} سنة &nbsp;|&nbsp; `:''}
          ${s.teacher_name?`الأستاذ: ${s.teacher_name} &nbsp;|&nbsp; `:''}
          ${s.phone?`📞 ${s.phone}`:''}
        </div>
        ${ach.length?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">${ach.map(a=>`<span class="ach">${a}</span>`).join('')}</div>`:''}
      </div>
    </div>

    <div class="prof-stats">
      <div class="pst"><div class="pst-v">${toAr(memorized.length)}</div><div class="pst-l">سور محفوظة</div></div>
      <div class="pst"><div class="pst-v">${toAr(pct)}%</div><div class="pst-l">نسبة الإتمام</div></div>
      <div class="pst"><div class="pst-v">${toAr(attPct)}%</div><div class="pst-l">نسبة الحضور</div></div>
    </div>

    <div class="sec-t">🗺️ خريطة الحفظ</div>
    <div class="qmap">
      ${surahs.map(su => {
        const m = mMap[su.id];
        return `<div class="st ${m?'mem':''}" title="${su.name} — ${toAr(su.ayah_count)} آية">
          <div class="st-n">${su.name}</div>
          <div class="st-g">${m ? m.grade : toAr(su.ayah_count)+'آ'}</div>
        </div>`;
      }).join('')}
    </div>

    ${memorized.length ? `
    <div class="sec-t">📖 سجل الحفظ</div>
    <div class="tw" style="margin-bottom:16px"><table>
      <thead><tr><th>السورة</th><th>الجزء</th><th>التقييم</th><th>التاريخ</th><th></th></tr></thead>
      <tbody>${memorized.map(m=>`<tr>
        <td><b>${m.surah_name}</b></td>
        <td><span class="badge bk">ج${toAr(m.juz)}</span></td>
        <td><span class="badge ${badgeCls(m.grade)}">${m.grade}</span></td>
        <td>${m.date}</td>
        <td><button class="btn btn-danger btn-xs _dm" data-mid="${m.id}" data-sid="${s.id}">🗑️</button></td>
      </tr>`).join('')}</tbody>
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
    <tbody>${memorized.map((m,i)=>`<tr><td>${i+1}</td><td>${m.surah_name}</td><td>${m.juz}</td><td>${m.grade}</td><td>${m.date}</td></tr>`).join('')}</tbody></table>`));
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
          ${surahs.map(s=>`<option value="${s.id}">سورة ${s.name} — ${toAr(s.ayah_count)} آية (ج${toAr(s.juz)})</option>`).join('')}
        </select>
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
      <button class="btn btn-primary" id="_msv" style="width:100%;justify-content:center;padding:12px">💾 حفظ الجلسة</button>`;

    $('_msv').addEventListener('click', async () => {
      const surah_id = Number($('_msu').value);
      if (!surah_id) return toast('اختر السورة', 'error');
      const btn = $('_msv'); btn.textContent = '⏳...'; btn.disabled = true;
      await window.api.addMemorization({ student_id:id, surah_id, date:$('_md').value, grade:$('_mgr').value, notes:$('_mnt').value });
      toast('✓ تم تسجيل جلسة الحفظ');
      btn.textContent = '💾 حفظ الجلسة'; btn.disabled = false;
      $('_mnt').value = '';
      const upd = await window.api.getStudents();
      const stu = upd.find(s=>s.id==id);
      if (stu) { $('_mst').textContent=`${toAr(stu.memorized_count)} سورة محفوظة من ١١٤`; $('_mpb').style.width=(stu.progress||0)+'%'; $('_mpp').textContent=toAr(stu.progress||0)+'%'; }
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
      <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.name}</td><td>${state[r.id]||'—'}</td></tr>`).join('')}</tbody></table>
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
    <div class="pf">الإجمالي: ${data.length} طالب | متوسط الحفظ: ${avg(data.map(r=>r.pct||0))}%</div>`));
};

// ── BOOT ───────────────────────────────────────────────────────────────
initLogin();