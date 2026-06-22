import api from './client'

export const adminApi = {
  login(email, password) {
    return api.post('/auth/login', { email, password })
  },
  logout() {
    return api.post('/auth/logout')
  },
  getDashboardSummary() {
    return api.get('/admin/dashboard/summary')
  },
  getAppointments(params) {
    return api.get('/admin/appointments', { params })
  },
  getAppointmentDetail(id) {
    return api.get(`/admin/appointments/${id}`)
  },
  updateAppointmentStatus(id, data) {
    return api.put(`/admin/appointments/${id}/status`, data)
  },
  rescheduleAppointment(id, data) {
    return api.put(`/admin/appointments/${id}/reschedule`, data)
  },
  deleteAppointment(id) {
    return api.delete(`/admin/appointments/${id}`)
  },
  getOffices() {
    return api.get('/admin/offices')
  },
  createOffice(data) {
    return api.post('/admin/offices', data)
  },
  updateOffice(id, data) {
    return api.put(`/admin/offices/${id}`, data)
  },
  updateOfficeSchedule(id, data) {
    return api.put(`/admin/offices/${id}/schedule`, data)
  },
  getConcernTypes() {
    return api.get('/admin/concern-types')
  },
  createConcernType(data) {
    return api.post('/admin/concern-types', data)
  },
  updateConcernType(id, data) {
    return api.put(`/admin/concern-types/${id}`, data)
  },
  getReports(type, params) {
    return api.get(`/admin/reports/${type}`, { params })
  },
  exportReport(type, format, params) {
    return api.get('/admin/reports/export', {
      params: { type, format, ...params },
      responseType: 'blob',
    })
  },
  getNotifications(params) {
    return api.get('/admin/notifications', { params })
  },
  resendNotification(id) {
    return api.post(`/admin/notifications/resend/${id}`)
  },
  getAuditLogs(params) {
    return api.get('/admin/audit-logs', { params })
  },
  getUsers() {
    return api.get('/admin/users')
  },
  createUser(data) {
    return api.post('/admin/users', data)
  },
  updateUser(id, data) {
    return api.put(`/admin/users/${id}`, data)
  },
  getTodayAppointments(params) {
    return api.get('/admin/appointments/today', { params })
  },
  saveAppointmentNotes(id, data) {
    return api.put(`/admin/appointments/${id}/notes`, data)
  },
}
