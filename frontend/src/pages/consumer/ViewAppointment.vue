<template>
  <div class="container">
    <div class="card search-card">
      <h2>View Appointment Details</h2>
      <p class="text-sm text-muted mb-4">Enter your reference number to view your appointment</p>
      <form @submit.prevent="handleSearch">
        <div class="form-group">
          <input v-model="refNumber" class="form-input" placeholder="ZNC2607000214" style="text-transform:uppercase;letter-spacing:0.05em" />
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%" :disabled="loading">
          {{ loading ? 'Searching...' : 'View Appointment' }}
        </button>
      </form>
      <div v-if="error" class="alert alert-error mt-4">{{ error }}</div>
    </div>
    <div v-if="appointment" class="card details-card mt-4">
      <div class="detail-row"><span class="detail-label">Reference Number</span><span class="ref-num">{{ appointment.reference_number }}</span></div>
      <div class="detail-row"><span class="detail-label">Consumer</span><span>{{ appointment.consumer_name }}</span></div>
      <div class="detail-row"><span class="detail-label">Account Number</span><span>{{ appointment.account_number }}</span></div>
      <div class="detail-row"><span class="detail-label">Concern</span><span>{{ appointment.concern_type }}</span></div>
      <div class="detail-row"><span class="detail-label">Office</span><span>{{ appointment.office }}</span></div>
      <div class="detail-row"><span class="detail-label">Date</span><span>{{ formatDate(appointment.appointment_date) }}</span></div>
      <div class="detail-row"><span class="detail-label">Time</span><span>{{ formatTime(appointment.start_time) }} - {{ formatTime(appointment.end_time) }}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span><StatusBadge :status="appointment.status" /></span></div>
      <div class="flex gap-4 mt-6">
        <router-link :to="'/reschedule?ref=' + appointment.reference_number" class="btn btn-secondary" style="flex:1">Reschedule</router-link>
        <router-link :to="'/cancel?ref=' + appointment.reference_number" class="btn btn-danger" style="flex:1">Cancel</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { consumerApi } from '../../api/consumer'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { formatDate, formatTime } from '../../utils/formatters'

const refNumber = ref('')
const appointment = ref(null)
const loading = ref(false)
const error = ref('')

function getMockAppointment(ref) {
  // First check the hardcoded demo
  const demos = {
    'ZNC2607000001': { reference_number: 'ZNC2607000001', consumer_name: 'Juan Dela Cruz', account_number: '12345678', concern_type: 'Clarification of Electric Bill Charges', office: 'Main Office', appointment_date: '2026-07-21', start_time: '09:00:00', end_time: '09:30:00', status: 'confirmed', created_at: '2026-06-20T10:30:00+08:00', mobile_number: '09171234567' },
  }
  if (demos[ref]) return demos[ref]
  // Then check localStorage for recently created mock appointments
  try {
    const stored = JSON.parse(localStorage.getItem('zaneco_mock_appts') || '{}')
    return stored[ref] || null
  } catch { return null }
}

async function handleSearch() {
  if (!refNumber.value.trim()) { error.value = 'Please enter a reference number'; return }
  loading.value = true
  error.value = ''
  appointment.value = null
  try {
    const { data } = await consumerApi.getAppointment(refNumber.value.trim())
    appointment.value = data.data
  } catch (err) {
    const mock = getMockAppointment(refNumber.value.trim())
    if (mock) {
      appointment.value = mock
    } else {
      error.value = 'Appointment not found. Please check your reference number.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.search-card { max-width: 480px; margin: 0 auto; }
.search-card h2 { font-size: var(--font-size-xl); margin-bottom: 0.25rem; }
.details-card { max-width: 560px; margin-left: auto; margin-right: auto; }
.detail-row {
  display: flex; justify-content: space-between;
  padding: 0.625rem 0; border-bottom: 1px solid var(--color-gray-100);
  font-size: var(--font-size-sm);
}
.detail-label { color: var(--color-gray-500); font-weight: 500; }
.ref-num { font-weight: 600; letter-spacing: 0.05em; }
.alert-error {
  background-color: var(--color-danger-light); color: var(--color-danger);
  padding: 0.75rem 1rem; border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
</style>
