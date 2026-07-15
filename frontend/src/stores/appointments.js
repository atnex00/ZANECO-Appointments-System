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
    async fetchAppointments(page = 1, perPage = 20) {
      this.loading = true
      try {
        const params = { page, per_page: perPage, ...this.filters }
        Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
        const { data } = await adminApi.getAppointments(params)
        this.list = data.data.appointments
        this.total = data.data.pagination.total
        this.currentPage = data.data.pagination.current_page
        this.lastPage = data.data.pagination.last_page
      } catch (err) {
        console.error('Failed to load appointments:', err)
        this.error = 'Failed to load appointments'
        this.list = []
        this.total = 0
        this.currentPage = 1
        this.lastPage = 1
      } finally {
        this.loading = false
      }
    },
    async fetchDetail(id) {
      this.loading = true
      try {
        const { data } = await adminApi.getAppointmentDetail(id)
        this.detail = data.data
      } catch (err) {
        console.error('Failed to load appointment details:', err)
        this.error = 'Failed to load appointment details'
        this.detail = null
      } finally {
        this.loading = false
      }
    },
    async updateStatus(id, status, notes) {
      try {
        await adminApi.updateAppointmentStatus(id, { status, notes })
        await this.fetchAppointments(this.currentPage)
      } catch (err) {
        console.error('Status update failed:', err)
        this.error = 'Failed to update status'
        throw err
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
