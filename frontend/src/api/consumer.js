import api from './client'

export const consumerApi = {
  getOffices() {
    return api.get('/offices')
  },
  getConcernTypes() {
    return api.get('/concern-types')
  },
  getTimeSlots(officeId, date) {
    return api.get(`/offices/${officeId}/slots`, { params: { date } })
  },
  getOfficeSchedule(officeId) {
    return api.get(`/offices/${officeId}/schedule`)
  },
  createAppointment(data) {
    return api.post('/appointments', data)
  },
  getAppointment(refNumber) {
    return api.get(`/appointments/${refNumber}`)
  },
  rescheduleAppointment(refNumber, data) {
    return api.put(`/appointments/${refNumber}/reschedule`, data)
  },
  cancelAppointment(refNumber, data) {
    return api.put(`/appointments/${refNumber}/cancel`, data)
  },
}
