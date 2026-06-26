import { defineStore } from 'pinia'
import { consumerApi } from '../api/consumer'

export const useBookingStore = defineStore('booking', {
  state: () => ({
    step: 1,
    consumerName: '',
    accountName: '',
    accountNumber: '',
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
  },
  actions: {
    setPersonalInfo(data) {
      this.consumerName = data.consumerName
      this.accountName = data.accountName
      this.accountNumber = data.accountNumber
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
          email: this.email || undefined,
          concern_type_id: this.concernTypeId,
          office_id: this.officeId,
          appointment_date: this.appointmentDate,
          start_time: this.startTime,
        })
        this.appointmentResult = data.data
        this.referenceNumber = data.data.reference_number
      } catch (err) {
        this.error = err.response?.data?.error?.message || err.message || 'Booking failed. Please try again.'
        throw err
      } finally {
        this.isLoading = false
      }
    },
    reset() {
      this.$reset()
    },
  },
})
