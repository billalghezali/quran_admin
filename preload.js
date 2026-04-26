const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Dashboard
  getDashboardStats: (tid) => ipcRenderer.invoke('dashboard:stats', tid),

  // Teachers
  getTeachers:  ()  => ipcRenderer.invoke('teachers:getAll'),
  addTeacher:   (d) => ipcRenderer.invoke('teachers:add', d),
  updateTeacher:(d) => ipcRenderer.invoke('teachers:update', d),
  deleteTeacher:(id)=> ipcRenderer.invoke('teachers:delete', id),

  // Students
  getStudents:    ()   => ipcRenderer.invoke('students:getAll'),
  addStudent:     (d)  => ipcRenderer.invoke('students:add', d),
  updateStudent:  (d)  => ipcRenderer.invoke('students:update', d),
  deleteStudent:  (id) => ipcRenderer.invoke('students:delete', id),
  getStudentById: (id) => ipcRenderer.invoke('students:getById', id),

  // Surahs
  getSurahs: () => ipcRenderer.invoke('surahs:getAll'),

  // Memorization
  addMemorization:    (d)  => ipcRenderer.invoke('memorization:add', d),
  deleteMemorization: (id) => ipcRenderer.invoke('memorization:delete', id),

  // Attendance
  getAttendanceByDate: (date)  => ipcRenderer.invoke('attendance:getByDate', date),
  saveAttendance:      (data)  => ipcRenderer.invoke('attendance:saveAll', data),

  // Reports
  getFullReport: () => ipcRenderer.invoke('reports:allStudents'),

  // Admin Password
  checkPassword: (pwd) => ipcRenderer.invoke('admin:checkPassword', pwd),
  setPassword:   (pwd) => ipcRenderer.invoke('admin:setPassword', pwd),
  hasPassword:   ()    => ipcRenderer.invoke('admin:hasPassword'),
});
