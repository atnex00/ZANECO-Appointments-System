import { defineStore } from 'pinia'
import { adminApi } from '../api/admin'

export const useAppointmentsStore = defineStore('appointments', {
  state: () => ({
    list: [],
    total: 0,
    currentPage: 1,
    lastPage: 1,
    filters: {
      status: '',
      office_id: '',
      date_from: '',
      date_to: '',
      search: '',
    },
    detail: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAppointments(page = 1) {
      this.loading = true
      try {
        const params = { page, ...this.filters }
        Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
        const { data } = await adminApi.getAppointments(params)
        this.list = data.data.appointments
        this.total = data.data.pagination.total
        this.currentPage = data.data.pagination.current_page
        this.lastPage = data.data.pagination.last_page
      } catch (err) {
        this.error = 'Failed to load appointments'
        // Fallback to localStorage mock appointments when backend is unavailable
        try {
          const stored = JSON.parse(localStorage.getItem('zaneco_mock_appts') || '{}')
          const mockList = Object.values(stored).map(a => ({
            id: a.reference_number, reference_number: a.reference_number,
            consumer_name: a.consumer_name, account_number: a.account_number,
            concern_type: a.concern_type, office: a.office,
            appointment_date: a.appointment_date, start_time: a.start_time,
            end_time: a.end_time, status: a.status, created_at: a.created_at,
          }))
          if (mockList.length) {
            this.list = mockList
            this.total = mockList.length
            this.lastPage = 1
            this.currentPage = 1
          }
        } catch {}
      } finally {
        this.loading = false
      }
    },
    async fetchDetail(id) {
      this.loading = true
      try {
        const { data } = await adminApi.getAppointmentDetail(id)
        this.detail = data.data
      } catch {
        this.error = 'Failed to load appointment details'
        // Fallback to localStorage mock
        try {
          const stored = JSON.parse(localStorage.getItem('zaneco_mock_appts') || '{}')
          const mock = Object.values(stored).find(a => a.reference_number === id || a.id === id)
          if (mock) {
            this.detail = {
              id: mock.reference_number, reference_number: mock.reference_number,
              consumer_name: mock.consumer_name, account_name: mock.account_name || mock.consumer_name,
              account_number: mock.account_number, mobile_number: mock.mobile_number || '09171234567',
              email: mock.email || null, concern_type: mock.concern_type, office: mock.office,
              appointment_date: mock.appointment_date, start_time: mock.start_time,
              end_time: mock.end_time, status: mock.status, admin_notes: null,
              created_at: mock.created_at, notifications: [], audit_trail: [],
            }
          }
        } catch {}
      } finally {
        this.loading = false
      }
    },
    async updateStatus(id, status, notes) {
      try {
        await adminApi.updateAppointmentStatus(id, { status, notes })
        await this.fetchAppointments(this.currentPage)
      } catch {
        this.error = 'Failed to update status'
      }
    },
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },
    clearFilters() {
      this.filters = { status: '', office_id: '', date_from: '', date_to: '', search: '' }
    },
  },
})
