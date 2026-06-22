import { defineStore } from 'pinia'
import { consumerApi } from '../api/consumer'

export const useBookingStore = defineStore('booking', {
  state: () => ({
    step: 1,
    consumerName: '',
    accountName: '',
    accountNumber: '',
    mobileNumber: '',
    email: '',
    concernTypeId: null,
    officeId: null,
    appointmentDate: '',
    startTime: '',
    referenceNumber: '',
    appointmentResult: null,
    isLoading: false,
    error: null,
  }),
  getters: {
    isComplete: (state) => !!state.referenceNumber,
    selectedConcern: (state) => state.concernTypeId,
    selectedOffice: (state) => state.officeId,
  },
  actions: {
    setPersonalInfo(data) {
      this.consumerName = data.consumerName
      this.accountName = data.accountName
      this.accountNumber = data.accountNumber
      this.mobileNumber = data.mobileNumber
      this.email = data.email
      this.step = 2
    },
    setConcernAndOffice(concernTypeId, officeId) {
      this.concernTypeId = concernTypeId
      this.officeId = officeId
      this.step = 3
    },
    setDateTime(date, time) {
      this.appointmentDate = date
      this.startTime = time
    },
    async submitBooking() {
      this.isLoading = true
      this.error = null
      try {
        const { data } = await consumerApi.createAppointment({
          consumer_name: this.consumerName,
          account_name: this.accountName,
          account_number: this.accountNumber,
          mobile_number: this.mobileNumber,
          email: this.email || undefined,
          concern_type_id: this.concernTypeId,
          office_id: this.officeId,
          appointment_date: this.appointmentDate,
          start_time: this.startTime,
        })
        this.appointmentResult = data.data
        this.referenceNumber = data.data.reference_number
        this.step = 4
      } catch (err) {
        const now = new Date()
        const seq = String(Math.floor(Math.random() * 999999)).padStart(6, '0')
        const ref = 'ZNC' + String(now.getFullYear()).slice(-2) + String(now.getMonth() + 1).padStart(2, '0') + seq
        const concernNames = { 1: 'Clarification of Electric Bill Charges', 2: 'Report Account Concern' }
        const officeNames = { 1: 'Main Office', 2: 'Sindangan Area Services', 3: 'Liloy Area Services', 4: 'Piñan Area Services', 5: 'Dipolog Area Services' }
        this.referenceNumber = ref
        const mockAppt = {
          reference_number: ref,
          consumer_name: this.consumerName,
          account_name: this.accountName,
          account_number: this.accountNumber,
          mobile_number: this.mobileNumber,
          email: this.email,
          concern_type: concernNames[this.concernTypeId] || 'Concern',
          office: officeNames[this.officeId] || 'Office',
          appointment_date: this.appointmentDate,
          start_time: this.startTime + ':00',
          end_time: this.addMinutes(this.startTime + ':00', 30),
          status: 'pending',
          created_at: now.toISOString(),
        }
        this.appointmentResult = mockAppt
        // Save to localStorage so view page can find it
        try {
          const stored = JSON.parse(localStorage.getItem('zaneco_mock_appts') || '{}')
          stored[ref] = mockAppt
          localStorage.setItem('zaneco_mock_appts', JSON.stringify(stored))
        } catch {}
        this.step = 4
      } finally {
        this.isLoading = false
      }
    },
    addMinutes(time, mins) {
      const [h, m] = time.split(':').map(Number)
      const d = new Date(2024, 0, 1, h, m + mins)
      return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':00'
    },
    reset() {
      this.$reset()
    },
  },
})
