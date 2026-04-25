/* ═══════════════════════════════════════════════════════════════════════
   نظام إدارة المدرسة القرآنية — app.js
   ═══════════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);
const el = (tag, cls, html = '') => Object.assign(document.createElement(tag), { className: cls, innerHTML: html });

// ── Toast ──────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  clearTimeout(toastTimer);
  const icons = { success: '✓', error: '✕' };
  const t = $('toast');
  t.innerHTML = `<span>${icons[type] || '•'}</span> ${msg}`;
  t.className = `toast ${type}`;
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

// ── Modal ──────────────────────────────────────────────────────────────
function openModal(title, bodyHTML) {
  $('modal-title').textContent = title;
  $('modal-body').innerHTML = bodyHTML;
  $('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  $('modal-overlay').classList.add('hidden');
  $('modal-body').innerHTML = '';
}
$('modal-close').addEventListener('click', closeModal);
$('modal-overlay').addEventListener('click', e => { if (e.target === $('modal-overlay')) closeModal(); });

// ── Print ──────────────────────────────────────────────────────────────
function printContent(html) {
  $('print-area').innerHTML = html;
  window.print();
}

// ── Date ───────────────────────────────────────────────────────────────
function updateDate() {
  const now = new Date();
  $('topbar-date').textContent = now.toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
updateDate();
setInterval(updateDate, 60000);

// ── Router ─────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'لوحة التحكم', students: 'إدارة الطلاب',
  teachers: 'إدارة الأساتذة', memorization: 'تسجيل الحفظ',
  attendance: 'الحضور والغياب', reports: 'التقارير'
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

$('btn-refresh').addEventListener('click', () => pages[currentPage]?.());

// ── Nav counts ─────────────────────────────────────────────────────────
async function updateNavCounts() {
  try {
    const stats = await window.api.getDashboardStats();
    $('nav-count-students').textContent = stats.totalStudents;
    $('nav-count-teachers').textContent = stats.totalTeachers;
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════════════════════
// 1. DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
pages.dashboard = async () => {
  const pg = $('page-dashboard');
  pg.innerHTML = `
    <div class="stats-grid stagger" id="stat-grid"></div>
    <div class="dash-grid">
      <div class="card">
        <div class="card-title">
          <div class="card-icon" style="background:var(--green-pale)">🏆</div>
          أفضل الطلاب حفظاً
        </div>
        <div class="top-list" id="top-students"></div>
      </div>
      <div class="card">
        <div class="card-title">
          <div class="card-icon" style="background:var(--blue-pale)">📋</div>
          آخر جلسات الحفظ
        </div>
        <div class="activity-list" id="recent-act"></div>
      </div>
    </div>`;

  const d = await window.api.getDashboardStats();
  updateNavCounts();

  const statCards = [
    { cls:'green', icon:'👥', label:'إجمالي الطلاب', val: d.totalStudents, trend:'مسجّل في النظام' },
    { cls:'blue',  icon:'🎓', label:'الأساتذة',      val: d.totalTeachers, trend:'كادر التدريس' },
    { cls:'gold',  icon:'✅', label:'حضور اليوم',    val: d.todayPresent,  trend:'الجلسة الحالية' },
    { cls:'red',   icon:'📖', label:'جلسات الحفظ',  val: d.totalSessions, trend:'إجمالي الجلسات' },
  ];
  $('stat-grid').innerHTML = statCards.map(s => `
    <div class="stat-card ${s.cls}">
      <div class="stat-bg-icon">${s.icon}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.val}</div>
      <div class="stat-trend">${s.trend}</div>
    </div>`).join('');

  $('top-students').innerHTML = d.topStudents.length
    ? d.topStudents.map((s, i) => `
        <div class="top-item">
          <div class="top-rank r${i+1}">${i+1}</div>
          <div class="top-name">${s.name}</div>
          <span class="badge badge-green">${s.cnt} سورة</span>
        </div>`).join('')
    : `<div class="empty"><div class="empty-icon">🎓</div><div class="empty-sub">ابدأ بتسجيل الحفظ</div></div>`;

  $('recent-act').innerHTML = d.recentActivity.length
    ? d.recentActivity.map(r => `
        <div class="activity-item">
          <div class="activity-dot"></div>
          <div class="activity-text"><b>${r.student}</b> — حفظ سورة ${r.surah}</div>
          <span class="badge badge-${r.grade==='ممتاز'?'green':r.grade==='جيد'?'blue':'gold'}">${r.grade}</span>
        </div>`).join('')
    : `<div class="empty"><div class="empty-icon">📋</div><div class="empty-sub">لا يوجد نشاطات بعد</div></div>`;
};

// ═══════════════════════════════════════════════════════════════════════
// 2. TEACHERS
// ═══════════════════════════════════════════════════════════════════════
pages.teachers = async () => {
  const pg = $('page-teachers');
  pg.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">الأساتذة</div>
        <div class="page-subtitle">إدارة الكادر التدريسي للمدرسة</div>
      </div>
      <button class="btn btn-primary" id="btn-add-teacher">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        إضافة أستاذ
      </button>
    </div>
    <div class="card">
      <div class="toolbar">
        <div class="search-box">
          <span class="search-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          <input class="input" id="teacher-search" placeholder="ابحث عن أستاذ..." style="padding-right:38px">
        </div>
        <button class="btn btn-print" id="btn-print-teachers">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          طباعة
        </button>
      </div>
      <div id="teachers-table"></div>
    </div>`;

  let teachers = [];
  const render = (list) => {
    $('teachers-table').innerHTML = list.length ? `
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>التخصص</th><th>عدد الطلاب</th><th>الإجراءات</th></tr></thead>
          <tbody>${list.map((t,i) => `
            <tr>
              <td><span class="badge badge-gray">${i+1}</span></td>
              <td><div class="td-name">${t.name}</div></td>
              <td>${t.phone || '<span class="badge badge-gray">—</span>'}</td>
              <td>${t.specialization ? `<span class="badge badge-blue">${t.specialization}</span>` : '<span class="badge badge-gray">—</span>'}</td>
              <td><span class="badge badge-green">${t.student_count} طالب</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-secondary btn-xs btn-edit-teacher" data-id="${t.id}">✏️ تعديل</button>
                  <button class="btn btn-danger btn-xs btn-del-teacher" data-id="${t.id}">🗑️</button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`
      : `<div class="empty"><div class="empty-icon">🎓</div><div class="empty-title">لا يوجد أساتذة</div><div class="empty-sub">ابدأ بإضافة أستاذ جديد</div></div>`;

    pg.querySelectorAll('.btn-edit-teacher').forEach(b => b.addEventListener('click', () =>
      teacherModal(teachers.find(t => t.id == b.dataset.id), load)));
    pg.querySelectorAll('.btn-del-teacher').forEach(b => b.addEventListener('click', () => delTeacher(b.dataset.id)));
  };

  const load = async () => { teachers = await window.api.getTeachers(); render(teachers); updateNavCounts(); };
  await load();

  $('teacher-search').addEventListener('input', e =>
    render(teachers.filter(t => t.name.includes(e.target.value) || (t.specialization||'').includes(e.target.value))));
  $('btn-add-teacher').addEventListener('click', () => teacherModal(null, load));
  $('btn-print-teachers').addEventListener('click', () => printTeachers(teachers));

  const delTeacher = async (id) => {
    if (!confirm('هل تريد حذف هذا الأستاذ؟')) return;
    await window.api.deleteTeacher(Number(id));
    showToast('تم حذف الأستاذ بنجاح');
    load();
  };
};

function printTeachers(teachers) {
  printContent(`
    <div class="print-header">
      <h1>قائمة الأساتذة</h1>
      <p>المدرسة القرآنية — تاريخ الطباعة: ${new Date().toLocaleDateString('ar-DZ')}</p>
    </div>
    <table class="print-table">
      <thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>التخصص</th><th>عدد الطلاب</th></tr></thead>
      <tbody>${teachers.map((t,i) => `
        <tr><td>${i+1}</td><td>${t.name}</td><td>${t.phone||'—'}</td><td>${t.specialization||'—'}</td><td>${t.student_count}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="print-footer">إجمالي الأساتذة: ${teachers.length}</div>`);
}

function teacherModal(data, onDone) {
  openModal(data ? 'تعديل بيانات الأستاذ' : 'إضافة أستاذ جديد', `
    <div class="form-group"><label>الاسم الكامل *</label><input class="input" id="t-name" value="${data?.name||''}" placeholder="أدخل الاسم الكامل"></div>
    <div class="form-row">
      <div class="form-group"><label>رقم الهاتف</label><input class="input" id="t-phone" value="${data?.phone||''}" placeholder="0xx xxx xxxx"></div>
      <div class="form-group"><label>التخصص</label><input class="input" id="t-spec" value="${data?.specialization||''}" placeholder="مثل: حفظ وتجويد"></div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px">
      <button class="btn btn-secondary" id="t-cancel">إلغاء</button>
      <button class="btn btn-primary" id="t-save">💾 حفظ</button>
    </div>`);
  $('t-cancel').addEventListener('click', closeModal);
  $('t-save').addEventListener('click', async () => {
    const name = $('t-name').value.trim();
    if (!name) return showToast('الاسم مطلوب', 'error');
    if (data) await window.api.updateTeacher({ id: data.id, name, phone: $('t-phone').value, specialization: $('t-spec').value });
    else await window.api.addTeacher({ name, phone: $('t-phone').value, specialization: $('t-spec').value });
    showToast(data ? 'تم تحديث بيانات الأستاذ ✓' : 'تم إضافة الأستاذ بنجاح ✓');
    closeModal(); onDone();
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 3. STUDENTS
// ═══════════════════════════════════════════════════════════════════════
pages.students = async () => {
  const pg = $('page-students');
  pg.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">الطلاب</div>
        <div class="page-subtitle">إدارة الطلاب وتتبع تقدمهم في الحفظ</div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-print" id="btn-print-students">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          طباعة القائمة
        </button>
        <button class="btn btn-primary" id="btn-add-student">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة طالب
        </button>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <div class="search-box">
          <span class="search-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          <input class="input" id="student-search" placeholder="ابحث عن طالب..." style="padding-right:38px">
        </div>
        <select class="input" id="filter-teacher" style="width:auto;min-width:160px">
          <option value="">كل الأساتذة</option>
        </select>
      </div>
      <div id="students-table"></div>
    </div>`;

  let students = [], teachers = [];

  const render = (list) => {
    $('students-table').innerHTML = list.length ? `
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>الطالب</th><th>العمر</th><th>الأستاذ</th><th>التقدم</th><th>السور</th><th>الإجراءات</th></tr></thead>
          <tbody>${list.map((s, i) => `
            <tr>
              <td><span class="badge badge-gray">${i+1}</span></td>
              <td>
                <div class="td-name">${s.name}</div>
                ${s.phone ? `<div class="td-sub">📞 ${s.phone}</div>` : ''}
              </td>
              <td>${s.age ? `<span class="badge badge-gray">${s.age} سنة</span>` : '—'}</td>
              <td>${s.teacher_name ? `<span class="badge badge-blue">${s.teacher_name}</span>` : '<span class="badge badge-gray">—</span>'}</td>
              <td>
                <div class="progress-wrap">
                  <div class="progress-bar"><div class="progress-fill" style="width:${s.progress||0}%"></div></div>
                  <span class="progress-pct">${s.progress||0}%</span>
                </div>
              </td>
              <td><span class="badge badge-green">${s.memorized_count}</span></td>
              <td>
                <div style="display:flex;gap:5px">
                  <button class="btn btn-outline btn-xs btn-view" data-id="${s.id}" title="ملف الطالب">👁️ ملف</button>
                  <button class="btn btn-secondary btn-xs btn-edit" data-id="${s.id}">✏️</button>
                  <button class="btn btn-danger btn-xs btn-del" data-id="${s.id}">🗑️</button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`
      : `<div class="empty"><div class="empty-icon">👤</div><div class="empty-title">لا يوجد طلاب</div><div class="empty-sub">ابدأ بإضافة طالب جديد</div></div>`;

    pg.querySelectorAll('.btn-view').forEach(b => b.addEventListener('click', () => openStudentProfile(b.dataset.id)));
    pg.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () =>
      studentModal(students.find(s => s.id == b.dataset.id), teachers, load)));
    pg.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => delStudent(b.dataset.id)));
  };

  const applyFilters = () => {
    const q = $('student-search').value.trim();
    const tid = $('filter-teacher').value;
    render(students.filter(s =>
      (!q || s.name.includes(q) || (s.teacher_name||'').includes(q)) &&
      (!tid || s.teacher_id == tid)
    ));
  };

  const load = async () => {
    [students, teachers] = await Promise.all([window.api.getStudents(), window.api.getTeachers()]);
    const sel = $('filter-teacher');
    sel.innerHTML = '<option value="">كل الأساتذة</option>' + teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    render(students);
    updateNavCounts();
  };
  await load();

  $('student-search').addEventListener('input', applyFilters);
  $('filter-teacher').addEventListener('change', applyFilters);
  $('btn-add-student').addEventListener('click', () => studentModal(null, teachers, load));
  $('btn-print-students').addEventListener('click', () => printStudents(students));

  const delStudent = async (id) => {
    if (!confirm('هل تريد حذف هذا الطالب وجميع بياناته؟')) return;
    await window.api.deleteStudent(Number(id));
    showToast('تم حذف الطالب بنجاح');
    load();
  };
};

function printStudents(students) {
  printContent(`
    <div class="print-header">
      <h1>قائمة الطلاب</h1>
      <p>المدرسة القرآنية — تاريخ الطباعة: ${new Date().toLocaleDateString('ar-DZ')}</p>
    </div>
    <table class="print-table">
      <thead><tr><th>#</th><th>اسم الطالب</th><th>العمر</th><th>الأستاذ</th><th>السور المحفوظة</th><th>نسبة التقدم</th><th>تاريخ الالتحاق</th></tr></thead>
      <tbody>${students.map((s,i) => `
        <tr>
          <td>${i+1}</td><td>${s.name}</td><td>${s.age||'—'}</td>
          <td>${s.teacher_name||'—'}</td><td>${s.memorized_count} / 114</td>
          <td>${s.progress||0}%</td><td>${s.enrollment_date||'—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="print-footer">
      إجمالي الطلاب: ${students.length} &nbsp;|&nbsp;
      متوسط التقدم: ${students.length ? Math.round(students.reduce((a,s)=>a+(s.progress||0),0)/students.length) : 0}%
    </div>`);
}

function studentModal(data, teachers, onDone) {
  const opts = teachers.map(t => `<option value="${t.id}" ${data?.teacher_id==t.id?'selected':''}>${t.name}</option>`).join('');
  openModal(data ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد', `
    <div class="form-group"><label>الاسم الكامل *</label><input class="input" id="s-name" value="${data?.name||''}" placeholder="أدخل الاسم الكامل للطالب"></div>
    <div class="form-row">
      <div class="form-group"><label>العمر</label><input class="input" type="number" id="s-age" value="${data?.age||''}" placeholder="العمر" min="4" max="99"></div>
      <div class="form-group"><label>هاتف ولي الأمر</label><input class="input" id="s-phone" value="${data?.phone||''}" placeholder="0xx xxx xxxx"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>الأستاذ المشرف</label>
        <select class="input" id="s-teacher"><option value="">— بدون أستاذ —</option>${opts}</select>
      </div>
      <div class="form-group"><label>تاريخ الالتحاق</label>
        <input class="input" type="date" id="s-date" value="${data?.enrollment_date||new Date().toISOString().split('T')[0]}">
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px">
      <button class="btn btn-secondary" id="s-cancel">إلغاء</button>
      <button class="btn btn-primary" id="s-save">💾 حفظ</button>
    </div>`);
  $('s-cancel').addEventListener('click', closeModal);
  $('s-save').addEventListener('click', async () => {
    const name = $('s-name').value.trim();
    if (!name) return showToast('الاسم مطلوب', 'error');
    const d = { name, age: $('s-age').value||null, phone: $('s-phone').value, teacher_id: $('s-teacher').value||null, enrollment_date: $('s-date').value };
    if (data) await window.api.updateStudent({ ...d, id: data.id });
    else await window.api.addStudent(d);
    showToast(data ? 'تم تحديث بيانات الطالب ✓' : 'تم إضافة الطالب بنجاح ✓');
    closeModal(); onDone();
  });
}

// ── Student Profile ────────────────────────────────────────────────────
async function openStudentProfile(id) {
  const { student: s, memorized, attendance } = await window.api.getStudentById(Number(id));
  const surahs = await window.api.getSurahs();
  const memorizedMap = {};
  memorized.forEach(m => memorizedMap[m.surah_id] = m);
  const presentDays = attendance.filter(a => a.status === 'حاضر').length;
  const attPct = attendance.length ? Math.round(presentDays * 100 / attendance.length) : 0;
  const gradeClass = g => ({ ممتاز:'badge-green', جيد:'badge-blue', مقبول:'badge-gold', ضعيف:'badge-red' }[g] || 'badge-gray');

  openModal(`ملف الطالب`, `
    <div class="profile-header">
      <div class="profile-avatar">👤</div>
      <div>
        <div class="profile-name">${s.name}</div>
        <div class="profile-meta">
          ${s.age ? `العمر: ${s.age} سنة` : ''}
          ${s.teacher_name ? ` &nbsp;|&nbsp; الأستاذ: ${s.teacher_name}` : ''}
          ${s.phone ? ` &nbsp;|&nbsp; 📞 ${s.phone}` : ''}
        </div>
      </div>
    </div>

    <div class="profile-stats">
      <div class="pstat"><div class="pstat-value">${memorized.length}</div><div class="pstat-label">سور محفوظة</div></div>
      <div class="pstat"><div class="pstat-value">${Math.round(memorized.length*100/114)}%</div><div class="pstat-label">نسبة الإتمام</div></div>
      <div class="pstat"><div class="pstat-value">${attPct}%</div><div class="pstat-label">نسبة الحضور</div></div>
    </div>

    <div class="section-title">🗺️ خريطة الحفظ</div>
    <div class="quran-map" style="margin-bottom:22px">
      ${surahs.map(su => {
        const m = memorizedMap[su.id];
        return `<div class="surah-tile ${m ? 'memorized' : ''}" title="${su.name} — ${su.ayah_count} آية">
          <div class="s-name">${su.name}</div>
          <div class="s-grade">${m ? m.grade : su.ayah_count+'آ'}</div>
        </div>`;
      }).join('')}
    </div>

    ${memorized.length ? `
    <div class="section-title">📖 سجل الحفظ</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>السورة</th><th>الجزء</th><th>التقييم</th><th>التاريخ</th><th></th></tr></thead>
        <tbody>${memorized.map(m => `
          <tr>
            <td><b>${m.surah_name}</b></td>
            <td><span class="badge badge-gray">ج${m.juz}</span></td>
            <td><span class="badge ${gradeClass(m.grade)}">${m.grade}</span></td>
            <td>${m.date}</td>
            <td><button class="btn btn-danger btn-xs del-mem" data-mid="${m.id}" data-sid="${s.id}">🗑️</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px">
      <button class="btn btn-print" id="btn-print-profile">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        طباعة الملف
      </button>
    </div>`);

  document.querySelectorAll('.del-mem').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('حذف هذا السجل؟')) return;
    await window.api.deleteMemorization(Number(b.dataset.mid));
    showToast('تم الحذف');
    closeModal();
    openStudentProfile(b.dataset.sid);
  }));

  $('btn-print-profile')?.addEventListener('click', () => {
    printContent(`
      <div class="print-header">
        <h1>ملف الطالب: ${s.name}</h1>
        <p>المدرسة القرآنية — ${s.teacher_name ? 'الأستاذ: '+s.teacher_name+' — ' : ''}تاريخ الطباعة: ${new Date().toLocaleDateString('ar-DZ')}</p>
      </div>
      <p style="margin-bottom:16px;font-size:14px">
        <b>السور المحفوظة:</b> ${memorized.length} من 114 &nbsp;|&nbsp;
        <b>نسبة التقدم:</b> ${Math.round(memorized.length*100/114)}% &nbsp;|&nbsp;
        <b>نسبة الحضور:</b> ${attPct}%
      </p>
      <table class="print-table">
        <thead><tr><th>#</th><th>السورة</th><th>الجزء</th><th>التقييم</th><th>التاريخ</th></tr></thead>
        <tbody>${memorized.map((m,i) => `<tr><td>${i+1}</td><td>${m.surah_name}</td><td>${m.juz}</td><td>${m.grade}</td><td>${m.date}</td></tr>`).join('')}</tbody>
      </table>`);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 4. MEMORIZATION
// ═══════════════════════════════════════════════════════════════════════
pages.memorization = async () => {
  const pg = $('page-memorization');
  pg.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">تسجيل الحفظ</div><div class="page-subtitle">إضافة جلسات الحفظ اليومية للطلاب</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1.4fr;gap:20px">
      <div class="card">
        <div class="card-title"><div class="card-icon" style="background:var(--green-pale)">👤</div> اختيار الطالب</div>
        <div class="form-group"><label>الطالب</label><select class="input" id="mem-student"><option value="">— اختر طالباً —</option></select></div>
        <div class="form-group"><label>التاريخ</label><input class="input" type="date" id="mem-date" value="${new Date().toISOString().split('T')[0]}"></div>
        <div id="mem-info" style="display:none;margin-top:14px;padding:14px;background:var(--green-pale);border-radius:var(--radius-sm);border:1px solid var(--green-pale2)">
          <div style="font-weight:700;color:var(--green)" id="mem-info-name"></div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:4px" id="mem-info-stats"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><div class="card-icon" style="background:var(--gold-pale)">📖</div> تسجيل الجلسة</div>
        <div id="mem-form-area">
          <div class="empty" style="padding:30px"><div class="empty-icon">👈</div><div class="empty-sub">اختر طالباً أولاً</div></div>
        </div>
      </div>
    </div>`;

  const [students, surahs] = await Promise.all([window.api.getStudents(), window.api.getSurahs()]);
  const sel = $('mem-student');
  students.forEach(s => sel.innerHTML += `<option value="${s.id}">${s.name} (${s.memorized_count} سورة)</option>`);

  sel.addEventListener('change', async () => {
    const id = Number(sel.value);
    if (!id) { $('mem-info').style.display='none'; $('mem-form-area').innerHTML = `<div class="empty" style="padding:30px"><div class="empty-icon">👈</div><div class="empty-sub">اختر طالباً أولاً</div></div>`; return; }
    const st = students.find(s => s.id == id);
    $('mem-info').style.display = 'block';
    $('mem-info-name').textContent = st.name;
    $('mem-info-stats').innerHTML = `السور المحفوظة: ${st.memorized_count} / 114 — التقدم: ${st.progress||0}%`;

    $('mem-form-area').innerHTML = `
      <div class="form-group"><label>السورة</label>
        <select class="input" id="mem-surah">
          <option value="">— اختر السورة —</option>
          ${surahs.map(s => `<option value="${s.id}">سورة ${s.name} — ${s.ayah_count} آية (ج${s.juz})</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label>التقييم</label>
          <select class="input" id="mem-grade">
            <option value="ممتاز">⭐⭐⭐ ممتاز</option>
            <option value="جيد">⭐⭐ جيد</option>
            <option value="مقبول">⭐ مقبول</option>
            <option value="ضعيف">⚠️ ضعيف — يحتاج مراجعة</option>
          </select>
        </div>
        <div class="form-group"><label>ملاحظات</label><input class="input" id="mem-notes" placeholder="ملاحظات اختيارية..."></div>
      </div>
      <button class="btn btn-primary" id="btn-save-mem" style="width:100%;justify-content:center;padding:13px">
        💾 حفظ الجلسة
      </button>`;

    $('btn-save-mem').addEventListener('click', async () => {
      const surah_id = Number($('mem-surah').value);
      if (!surah_id) return showToast('يرجى اختيار السورة', 'error');
      const btn = $('btn-save-mem');
      btn.textContent = '⏳ جاري الحفظ...';
      btn.disabled = true;
      await window.api.addMemorization({
        student_id: id, surah_id,
        date: $('mem-date').value,
        grade: $('mem-grade').value,
        notes: $('mem-notes').value
      });
      showToast('✓ تم تسجيل جلسة الحفظ بنجاح');
      btn.textContent = '💾 حفظ الجلسة';
      btn.disabled = false;
      $('mem-notes').value = '';
      const updated = await window.api.getStudents();
      const stu = updated.find(s => s.id == id);
      if (stu) $('mem-info-stats').innerHTML = `السور المحفوظة: ${stu.memorized_count} / 114 — التقدم: ${stu.progress||0}%`;
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
    <div class="page-header">
      <div><div class="page-title">الحضور والغياب</div><div class="page-subtitle">تسجيل حضور الطلاب اليومي</div></div>
      <div style="display:flex;gap:10px;align-items:center">
        <input class="input" type="date" id="att-date" value="${today}" style="width:180px">
        <button class="btn btn-primary" id="btn-save-att">💾 حفظ الحضور</button>
        <button class="btn btn-print" id="btn-print-att">🖨️ طباعة</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
        <div style="font-size:13px;color:var(--text-dim)">الإجمالي: <b id="att-total" style="color:var(--text)">0</b></div>
        <div style="font-size:13px"><span style="color:var(--green)">حاضر: <b id="att-present">0</b></span></div>
        <div style="font-size:13px"><span style="color:var(--red)">غائب: <b id="att-absent">0</b></span></div>
        <div style="font-size:13px"><span style="color:var(--gold)">بعذر: <b id="att-excuse">0</b></span></div>
        <div style="margin-right:auto;display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" id="btn-all-present">✅ تحديد الكل حاضر</button>
          <button class="btn btn-secondary btn-sm" id="btn-all-absent">❌ تحديد الكل غائب</button>
        </div>
      </div>
    </div>

    <div class="card"><div id="att-list"></div></div>`;

  const attState = {};
  const updateCounts = () => {
    const vals = Object.values(attState);
    $('att-total').textContent = vals.length;
    $('att-present').textContent = vals.filter(v => v === 'حاضر').length;
    $('att-absent').textContent  = vals.filter(v => v === 'غائب').length;
    $('att-excuse').textContent  = vals.filter(v => v === 'بعذر').length;
  };

  let currentRows = [];
  const loadAtt = async () => {
    const date = $('att-date').value;
    currentRows = await window.api.getAttendanceByDate(date);
    const list = $('att-list');
    list.innerHTML = currentRows.length
      ? currentRows.map(r => `
          <div class="att-row" id="arow-${r.id}">
            <div class="att-name">${r.name}</div>
            <div class="att-btns">
              <button class="att-btn ${r.status==='حاضر'?'present':''}" data-id="${r.id}" data-val="حاضر">✓ حاضر</button>
              <button class="att-btn ${r.status==='غائب'?'absent':''}"  data-id="${r.id}" data-val="غائب">✕ غائب</button>
              <button class="att-btn ${r.status==='بعذر'?'excuse':''}"  data-id="${r.id}" data-val="بعذر">📋 بعذر</button>
            </div>
          </div>`).join('')
      : `<div class="empty"><div class="empty-icon">👤</div><div class="empty-title">لا يوجد طلاب</div><div class="empty-sub">أضف طلاباً أولاً</div></div>`;

    currentRows.forEach(r => { if (r.status) attState[r.id] = r.status; });
    updateCounts();

    list.querySelectorAll('.att-btn').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.id, val = b.dataset.val;
      attState[id] = val;
      const row = $(`arow-${id}`);
      row.querySelectorAll('.att-btn').forEach(x => x.className = 'att-btn');
      b.classList.add(val === 'حاضر' ? 'present' : val === 'غائب' ? 'absent' : 'excuse');
      updateCounts();
    }));
  };

  await loadAtt();
  $('att-date').addEventListener('change', () => { Object.keys(attState).forEach(k => delete attState[k]); loadAtt(); });

  $('btn-all-present').addEventListener('click', () => {
    currentRows.forEach(r => {
      attState[r.id] = 'حاضر';
      const row = $(`arow-${r.id}`);
      row?.querySelectorAll('.att-btn').forEach(x => x.className = 'att-btn');
      row?.querySelector('[data-val="حاضر"]')?.classList.add('present');
    });
    updateCounts();
  });

  $('btn-all-absent').addEventListener('click', () => {
    currentRows.forEach(r => {
      attState[r.id] = 'غائب';
      const row = $(`arow-${r.id}`);
      row?.querySelectorAll('.att-btn').forEach(x => x.className = 'att-btn');
      row?.querySelector('[data-val="غائب"]')?.classList.add('absent');
    });
    updateCounts();
  });

  $('btn-save-att').addEventListener('click', async () => {
    const date = $('att-date').value;
    const records = Object.entries(attState).map(([id, status]) => ({ id: Number(id), status }));
    await window.api.saveAttendance({ date, records });
    showToast('✓ تم حفظ الحضور بنجاح');
  });

  $('btn-print-att').addEventListener('click', () => {
    const date = $('att-date').value;
    printContent(`
      <div class="print-header">
        <h1>كشف الحضور</h1>
        <p>المدرسة القرآنية — التاريخ: ${date}</p>
      </div>
      <table class="print-table">
        <thead><tr><th>#</th><th>اسم الطالب</th><th>الحالة</th></tr></thead>
        <tbody>${currentRows.map((r,i) => `
          <tr><td>${i+1}</td><td>${r.name}</td><td>${attState[r.id]||'—'}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="print-footer">
        حاضر: ${Object.values(attState).filter(v=>v==='حاضر').length} |
        غائب: ${Object.values(attState).filter(v=>v==='غائب').length} |
        بعذر: ${Object.values(attState).filter(v=>v==='بعذر').length}
      </div>`);
  });
};

// ═══════════════════════════════════════════════════════════════════════
// 6. REPORTS
// ═══════════════════════════════════════════════════════════════════════
pages.reports = async () => {
  const pg = $('page-reports');
  pg.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">التقارير</div><div class="page-subtitle">تقرير شامل لأداء جميع الطلاب</div></div>
      <button class="btn btn-print" id="btn-print-report">🖨️ طباعة التقرير</button>
    </div>
    <div class="card" style="text-align:center;padding:48px;color:var(--text-muted)">
      <div style="font-size:32px;margin-bottom:8px">⏳</div>
      جاري تحميل التقرير...
    </div>`;

  const data = await window.api.getFullReport();
  const gradeClass = pct => pct >= 75 ? 'badge-green' : pct >= 40 ? 'badge-gold' : 'badge-red';

  pg.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">التقارير</div><div class="page-subtitle">تقرير شامل لأداء جميع الطلاب</div></div>
      <button class="btn btn-print" id="btn-print-report">🖨️ طباعة التقرير</button>
    </div>

    <div class="stats-grid stagger" style="margin-bottom:20px">
      <div class="stat-card green">
        <div class="stat-bg-icon">👥</div>
        <div class="stat-label">إجمالي الطلاب</div>
        <div class="stat-value">${data.length}</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-bg-icon">📊</div>
        <div class="stat-label">متوسط التقدم</div>
        <div class="stat-value">${data.length ? Math.round(data.reduce((a,r)=>a+(r.pct||0),0)/data.length) : 0}%</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-bg-icon">🏆</div>
        <div class="stat-label">أعلى نسبة حفظ</div>
        <div class="stat-value">${data.length ? data[0].pct||0 : 0}%</div>
      </div>
      <div class="stat-card red">
        <div class="stat-bg-icon">⚠️</div>
        <div class="stat-label">يحتاجون متابعة</div>
        <div class="stat-value">${data.filter(r=>(r.pct||0)<40).length}</div>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>الطالب</th><th>الأستاذ</th><th>السور المحفوظة</th><th>نسبة الحفظ</th><th>أيام الحضور</th><th>نسبة الحضور</th><th>الحالة</th></tr>
          </thead>
          <tbody>${data.map((r, i) => {
            const attPct = r.total_days ? Math.round(r.present_days*100/r.total_days) : 0;
            const statusLabel = (r.pct||0) >= 75 ? ['ممتاز','badge-green'] : (r.pct||0) >= 40 ? ['جيد','badge-gold'] : ['يحتاج متابعة','badge-red'];
            return `<tr>
              <td><span class="badge badge-gray">${i+1}</span></td>
              <td><div class="td-name">${r.name}</div></td>
              <td>${r.teacher_name ? `<span class="badge badge-blue">${r.teacher_name}</span>` : '—'}</td>
              <td><span class="badge badge-green">${r.memorized} / 114</span></td>
              <td>
                <div class="progress-wrap">
                  <div class="progress-bar"><div class="progress-fill" style="width:${r.pct||0}%"></div></div>
                  <span class="progress-pct">${r.pct||0}%</span>
                </div>
              </td>
              <td>${r.present_days} / ${r.total_days}</td>
              <td><span class="badge ${gradeClass(attPct)}">${attPct}%</span></td>
              <td><span class="badge ${statusLabel[1]}">${statusLabel[0]}</span></td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  $('btn-print-report').addEventListener('click', () => {
    printContent(`
      <div class="print-header">
        <h1>تقرير شامل — المدرسة القرآنية</h1>
        <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-DZ')}</p>
      </div>
      <table class="print-table">
        <thead><tr><th>#</th><th>الطالب</th><th>الأستاذ</th><th>السور</th><th>الحفظ%</th><th>الحضور%</th><th>الحالة</th></tr></thead>
        <tbody>${data.map((r,i) => {
          const attPct = r.total_days ? Math.round(r.present_days*100/r.total_days) : 0;
          const status = (r.pct||0) >= 75 ? 'ممتاز' : (r.pct||0) >= 40 ? 'جيد' : 'يحتاج متابعة';
          return `<tr><td>${i+1}</td><td>${r.name}</td><td>${r.teacher_name||'—'}</td><td>${r.memorized}/114</td><td>${r.pct||0}%</td><td>${attPct}%</td><td>${status}</td></tr>`;
        }).join('')}
        </tbody>
      </table>
      <div class="print-footer">
        الإجمالي: ${data.length} طالب |
        متوسط الحفظ: ${data.length ? Math.round(data.reduce((a,r)=>a+(r.pct||0),0)/data.length) : 0}%
      </div>`);
  });
};

// ── Boot ───────────────────────────────────────────────────────────────
pages.dashboard();
updateNavCounts();
