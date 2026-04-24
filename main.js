const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");

let db;
let mainWindow;

// ─── بيانات السور الـ 114 ──────────────────────────────────────────────────────
const SURAHS = [
  { id: 1, name: "الفاتحة", ayah_count: 7, juz: 1 },
  { id: 2, name: "البقرة", ayah_count: 286, juz: 1 },
  { id: 3, name: "آل عمران", ayah_count: 200, juz: 3 },
  { id: 4, name: "النساء", ayah_count: 176, juz: 4 },
  { id: 5, name: "المائدة", ayah_count: 120, juz: 6 },
  { id: 6, name: "الأنعام", ayah_count: 165, juz: 7 },
  { id: 7, name: "الأعراف", ayah_count: 206, juz: 8 },
  { id: 8, name: "الأنفال", ayah_count: 75, juz: 9 },
  { id: 9, name: "التوبة", ayah_count: 129, juz: 10 },
  { id: 10, name: "يونس", ayah_count: 109, juz: 11 },
  { id: 11, name: "هود", ayah_count: 123, juz: 11 },
  { id: 12, name: "يوسف", ayah_count: 111, juz: 12 },
  { id: 13, name: "الرعد", ayah_count: 43, juz: 13 },
  { id: 14, name: "إبراهيم", ayah_count: 52, juz: 13 },
  { id: 15, name: "الحجر", ayah_count: 99, juz: 14 },
  { id: 16, name: "النحل", ayah_count: 128, juz: 14 },
  { id: 17, name: "الإسراء", ayah_count: 111, juz: 15 },
  { id: 18, name: "الكهف", ayah_count: 110, juz: 15 },
  { id: 19, name: "مريم", ayah_count: 98, juz: 16 },
  { id: 20, name: "طه", ayah_count: 135, juz: 16 },
  { id: 21, name: "الأنبياء", ayah_count: 112, juz: 17 },
  { id: 22, name: "الحج", ayah_count: 78, juz: 17 },
  { id: 23, name: "المؤمنون", ayah_count: 118, juz: 18 },
  { id: 24, name: "النور", ayah_count: 64, juz: 18 },
  { id: 25, name: "الفرقان", ayah_count: 77, juz: 18 },
  { id: 26, name: "الشعراء", ayah_count: 227, juz: 19 },
  { id: 27, name: "النمل", ayah_count: 93, juz: 19 },
  { id: 28, name: "القصص", ayah_count: 88, juz: 20 },
  { id: 29, name: "العنكبوت", ayah_count: 69, juz: 20 },
  { id: 30, name: "الروم", ayah_count: 60, juz: 21 },
  { id: 31, name: "لقمان", ayah_count: 34, juz: 21 },
  { id: 32, name: "السجدة", ayah_count: 30, juz: 21 },
  { id: 33, name: "الأحزاب", ayah_count: 73, juz: 21 },
  { id: 34, name: "سبأ", ayah_count: 54, juz: 22 },
  { id: 35, name: "فاطر", ayah_count: 45, juz: 22 },
  { id: 36, name: "يس", ayah_count: 83, juz: 22 },
  { id: 37, name: "الصافات", ayah_count: 182, juz: 23 },
  { id: 38, name: "ص", ayah_count: 88, juz: 23 },
  { id: 39, name: "الزمر", ayah_count: 75, juz: 23 },
  { id: 40, name: "غافر", ayah_count: 85, juz: 24 },
  { id: 41, name: "فصلت", ayah_count: 54, juz: 24 },
  { id: 42, name: "الشورى", ayah_count: 53, juz: 25 },
  { id: 43, name: "الزخرف", ayah_count: 89, juz: 25 },
  { id: 44, name: "الدخان", ayah_count: 59, juz: 25 },
  { id: 45, name: "الجاثية", ayah_count: 37, juz: 25 },
  { id: 46, name: "الأحقاف", ayah_count: 35, juz: 26 },
  { id: 47, name: "محمد", ayah_count: 38, juz: 26 },
  { id: 48, name: "الفتح", ayah_count: 29, juz: 26 },
  { id: 49, name: "الحجرات", ayah_count: 18, juz: 26 },
  { id: 50, name: "ق", ayah_count: 45, juz: 26 },
  { id: 51, name: "الذاريات", ayah_count: 60, juz: 26 },
  { id: 52, name: "الطور", ayah_count: 49, juz: 27 },
  { id: 53, name: "النجم", ayah_count: 62, juz: 27 },
  { id: 54, name: "القمر", ayah_count: 55, juz: 27 },
  { id: 55, name: "الرحمن", ayah_count: 78, juz: 27 },
  { id: 56, name: "الواقعة", ayah_count: 96, juz: 27 },
  { id: 57, name: "الحديد", ayah_count: 29, juz: 27 },
  { id: 58, name: "المجادلة", ayah_count: 22, juz: 28 },
  { id: 59, name: "الحشر", ayah_count: 24, juz: 28 },
  { id: 60, name: "الممتحنة", ayah_count: 13, juz: 28 },
  { id: 61, name: "الصف", ayah_count: 14, juz: 28 },
  { id: 62, name: "الجمعة", ayah_count: 11, juz: 28 },
  { id: 63, name: "المنافقون", ayah_count: 11, juz: 28 },
  { id: 64, name: "التغابن", ayah_count: 18, juz: 28 },
  { id: 65, name: "الطلاق", ayah_count: 12, juz: 28 },
  { id: 66, name: "التحريم", ayah_count: 12, juz: 28 },
  { id: 67, name: "الملك", ayah_count: 30, juz: 29 },
  { id: 68, name: "القلم", ayah_count: 52, juz: 29 },
  { id: 69, name: "الحاقة", ayah_count: 52, juz: 29 },
  { id: 70, name: "المعارج", ayah_count: 44, juz: 29 },
  { id: 71, name: "نوح", ayah_count: 28, juz: 29 },
  { id: 72, name: "الجن", ayah_count: 28, juz: 29 },
  { id: 73, name: "المزمل", ayah_count: 20, juz: 29 },
  { id: 74, name: "المدثر", ayah_count: 56, juz: 29 },
  { id: 75, name: "القيامة", ayah_count: 40, juz: 29 },
  { id: 76, name: "الإنسان", ayah_count: 31, juz: 29 },
  { id: 77, name: "المرسلات", ayah_count: 50, juz: 29 },
  { id: 78, name: "النبأ", ayah_count: 40, juz: 30 },
  { id: 79, name: "النازعات", ayah_count: 46, juz: 30 },
  { id: 80, name: "عبس", ayah_count: 42, juz: 30 },
  { id: 81, name: "التكوير", ayah_count: 29, juz: 30 },
  { id: 82, name: "الإنفطار", ayah_count: 19, juz: 30 },
  { id: 83, name: "المطففين", ayah_count: 36, juz: 30 },
  { id: 84, name: "الإنشقاق", ayah_count: 25, juz: 30 },
  { id: 85, name: "البروج", ayah_count: 22, juz: 30 },
  { id: 86, name: "الطارق", ayah_count: 17, juz: 30 },
  { id: 87, name: "الأعلى", ayah_count: 19, juz: 30 },
  { id: 88, name: "الغاشية", ayah_count: 26, juz: 30 },
  { id: 89, name: "الفجر", ayah_count: 30, juz: 30 },
  { id: 90, name: "البلد", ayah_count: 20, juz: 30 },
  { id: 91, name: "الشمس", ayah_count: 15, juz: 30 },
  { id: 92, name: "الليل", ayah_count: 21, juz: 30 },
  { id: 93, name: "الضحى", ayah_count: 11, juz: 30 },
  { id: 94, name: "الشرح", ayah_count: 8, juz: 30 },
  { id: 95, name: "التين", ayah_count: 8, juz: 30 },
  { id: 96, name: "العلق", ayah_count: 19, juz: 30 },
  { id: 97, name: "القدر", ayah_count: 5, juz: 30 },
  { id: 98, name: "البينة", ayah_count: 8, juz: 30 },
  { id: 99, name: "الزلزلة", ayah_count: 8, juz: 30 },
  { id: 100, name: "العاديات", ayah_count: 11, juz: 30 },
  { id: 101, name: "القارعة", ayah_count: 11, juz: 30 },
  { id: 102, name: "التكاثر", ayah_count: 8, juz: 30 },
  { id: 103, name: "العصر", ayah_count: 3, juz: 30 },
  { id: 104, name: "الهمزة", ayah_count: 9, juz: 30 },
  { id: 105, name: "الفيل", ayah_count: 5, juz: 30 },
  { id: 106, name: "قريش", ayah_count: 4, juz: 30 },
  { id: 107, name: "الماعون", ayah_count: 7, juz: 30 },
  { id: 108, name: "الكوثر", ayah_count: 3, juz: 30 },
  { id: 109, name: "الكافرون", ayah_count: 6, juz: 30 },
  { id: 110, name: "النصر", ayah_count: 3, juz: 30 },
  { id: 111, name: "المسد", ayah_count: 5, juz: 30 },
  { id: 112, name: "الإخلاص", ayah_count: 4, juz: 30 },
  { id: 113, name: "الفلق", ayah_count: 5, juz: 30 },
  { id: 114, name: "الناس", ayah_count: 6, juz: 30 },
];

// ─── قاعدة البيانات ────────────────────────────────────────────────────────────
function initDB() {
  const dbFile = path.join(app.getPath("userData"), "quran_school.db");
  db = new Database(dbFile);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      specialization TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      phone TEXT,
      teacher_id INTEGER REFERENCES teachers(id),
      enrollment_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS surahs (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      ayah_count INTEGER,
      juz INTEGER
    );
    CREATE TABLE IF NOT EXISTS memorization (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id),
      surah_id  INTEGER NOT NULL REFERENCES surahs(id),
      date DATE DEFAULT CURRENT_DATE,
      grade TEXT,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id),
      date DATE NOT NULL,
      status TEXT,
      UNIQUE(student_id, date)
    );
  `);

  if (db.prepare("SELECT COUNT(*) as c FROM surahs").get().c === 0) {
    const ins = db.prepare("INSERT INTO surahs VALUES (?,?,?,?)");
    db.transaction(() =>
      SURAHS.forEach((s) => ins.run(s.id, s.name, s.ayah_count, s.juz)),
    )();
  }
}

// ─── نافذة التطبيق ─────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#0B1E13",
    show: false,
    title: "نظام إدارة المدرسة القرآنية",
  });
  mainWindow.loadFile("renderer/index.html");
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  initDB();
  createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ═══════════════════════════════════════════════════════════════════════════════
// IPC Handlers
// ═══════════════════════════════════════════════════════════════════════════════

// ─── لوحة التحكم ──────────────────────────────────────────────────────────────
ipcMain.handle("dashboard:stats", () => ({
  totalStudents: db.prepare("SELECT COUNT(*) as c FROM students").get().c,
  totalTeachers: db.prepare("SELECT COUNT(*) as c FROM teachers").get().c,
  todayPresent: db
    .prepare(
      "SELECT COUNT(*) as c FROM attendance WHERE date=date('now') AND status='حاضر'",
    )
    .get().c,
  totalSessions: db.prepare("SELECT COUNT(*) as c FROM memorization").get().c,
  topStudents: db
    .prepare(
      `
    SELECT s.name, COUNT(m.id) as cnt
    FROM students s LEFT JOIN memorization m ON s.id=m.student_id
    GROUP BY s.id ORDER BY cnt DESC LIMIT 5`,
    )
    .all(),
  recentActivity: db
    .prepare(
      `
    SELECT s.name as student, su.name as surah, m.grade, m.date
    FROM memorization m
    JOIN students s ON m.student_id=s.id
    JOIN surahs su ON m.surah_id=su.id
    ORDER BY m.rowid DESC LIMIT 8`,
    )
    .all(),
}));

// ─── الأساتذة ──────────────────────────────────────────────────────────────────
ipcMain.handle("teachers:getAll", () =>
  db
    .prepare(
      `SELECT t.*, COUNT(s.id) as student_count
    FROM teachers t LEFT JOIN students s ON t.id=s.teacher_id
    GROUP BY t.id ORDER BY t.name`,
    )
    .all(),
);
ipcMain.handle("teachers:add", (_, d) => {
  const r = db
    .prepare("INSERT INTO teachers (name,phone,specialization) VALUES (?,?,?)")
    .run(d.name, d.phone || "", d.specialization || "");
  return { success: true, id: r.lastInsertRowid };
});
ipcMain.handle("teachers:update", (_, d) => {
  db.prepare(
    "UPDATE teachers SET name=?,phone=?,specialization=? WHERE id=?",
  ).run(d.name, d.phone || "", d.specialization || "", d.id);
  return { success: true };
});
ipcMain.handle("teachers:delete", (_, id) => {
  db.prepare("UPDATE students SET teacher_id=NULL WHERE teacher_id=?").run(id);
  db.prepare("DELETE FROM teachers WHERE id=?").run(id);
  return { success: true };
});

// ─── الطلاب ────────────────────────────────────────────────────────────────────
ipcMain.handle("students:getAll", () =>
  db
    .prepare(
      `
    SELECT s.*, t.name as teacher_name,
      COUNT(DISTINCT m.id) as memorized_count,
      ROUND(COUNT(DISTINCT m.id)*100.0/114,1) as progress
    FROM students s
    LEFT JOIN teachers t ON s.teacher_id=t.id
    LEFT JOIN memorization m ON s.id=m.student_id
    GROUP BY s.id ORDER BY s.name`,
    )
    .all(),
);
ipcMain.handle("students:add", (_, d) => {
  const r = db
    .prepare(
      "INSERT INTO students (name,age,phone,teacher_id,enrollment_date) VALUES (?,?,?,?,?)",
    )
    .run(
      d.name,
      d.age || null,
      d.phone || "",
      d.teacher_id || null,
      d.enrollment_date || new Date().toISOString().split("T")[0],
    );
  return { success: true, id: r.lastInsertRowid };
});
ipcMain.handle("students:update", (_, d) => {
  db.prepare(
    "UPDATE students SET name=?,age=?,phone=?,teacher_id=?,enrollment_date=? WHERE id=?",
  ).run(
    d.name,
    d.age || null,
    d.phone || "",
    d.teacher_id || null,
    d.enrollment_date,
    d.id,
  );
  return { success: true };
});
ipcMain.handle("students:delete", (_, id) => {
  db.prepare("DELETE FROM memorization WHERE student_id=?").run(id);
  db.prepare("DELETE FROM attendance WHERE student_id=?").run(id);
  db.prepare("DELETE FROM students WHERE id=?").run(id);
  return { success: true };
});
ipcMain.handle("students:getById", (_, id) => ({
  student: db
    .prepare(
      "SELECT s.*,t.name as teacher_name FROM students s LEFT JOIN teachers t ON s.teacher_id=t.id WHERE s.id=?",
    )
    .get(id),
  memorized: db
    .prepare(
      "SELECT m.*,su.name as surah_name,su.ayah_count,su.juz FROM memorization m JOIN surahs su ON m.surah_id=su.id WHERE m.student_id=? ORDER BY su.id",
    )
    .all(id),
  attendance: db
    .prepare(
      "SELECT * FROM attendance WHERE student_id=? ORDER BY date DESC LIMIT 60",
    )
    .all(id),
}));

// ─── السور ────────────────────────────────────────────────────────────────────
ipcMain.handle("surahs:getAll", () =>
  db.prepare("SELECT * FROM surahs ORDER BY id").all(),
);

// ─── الحفظ ────────────────────────────────────────────────────────────────────
ipcMain.handle("memorization:add", (_, d) => {
  const exists = db
    .prepare("SELECT id FROM memorization WHERE student_id=? AND surah_id=?")
    .get(d.student_id, d.surah_id);
  if (exists) {
    db.prepare("UPDATE memorization SET date=?,grade=?,notes=? WHERE id=?").run(
      d.date,
      d.grade,
      d.notes || "",
      exists.id,
    );
  } else {
    db.prepare(
      "INSERT INTO memorization (student_id,surah_id,date,grade,notes) VALUES (?,?,?,?,?)",
    ).run(d.student_id, d.surah_id, d.date, d.grade, d.notes || "");
  }
  return { success: true };
});
ipcMain.handle("memorization:delete", (_, id) => {
  db.prepare("DELETE FROM memorization WHERE id=?").run(id);
  return { success: true };
});

// ─── الحضور ───────────────────────────────────────────────────────────────────
ipcMain.handle("attendance:getByDate", (_, date) =>
  db
    .prepare(
      `SELECT s.id, s.name, a.status
    FROM students s LEFT JOIN attendance a ON s.id=a.student_id AND a.date=?
    ORDER BY s.name`,
    )
    .all(date),
);
ipcMain.handle("attendance:saveAll", (_, { date, records }) => {
  const ups = db.prepare(
    "INSERT INTO attendance (student_id,date,status) VALUES (?,?,?) ON CONFLICT(student_id,date) DO UPDATE SET status=excluded.status",
  );
  db.transaction(() => records.forEach((r) => ups.run(r.id, date, r.status)))();
  return { success: true };
});

// ─── التقارير ─────────────────────────────────────────────────────────────────
ipcMain.handle("reports:allStudents", () =>
  db
    .prepare(
      `
    SELECT s.name, t.name as teacher_name,
      COUNT(DISTINCT m.id) as memorized,
      ROUND(COUNT(DISTINCT m.id)*100.0/114,1) as pct,
      COUNT(DISTINCT CASE WHEN a.status='حاضر' THEN a.id END) as present_days,
      COUNT(DISTINCT a.id) as total_days
    FROM students s
    LEFT JOIN teachers t ON s.teacher_id=t.id
    LEFT JOIN memorization m ON s.id=m.student_id
    LEFT JOIN attendance a ON s.id=a.student_id
    GROUP BY s.id ORDER BY pct DESC`,
    )
    .all(),
);
