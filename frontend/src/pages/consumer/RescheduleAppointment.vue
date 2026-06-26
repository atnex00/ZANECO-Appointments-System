<template>
  <div class="container">
    <div class="card form-card" v-if="step === 'verify'">
      <h2>Reschedule Appointment</h2>
      <p class="text-sm text-muted mb-4">Enter your reference number to verify your identity</p>
      <form @submit.prevent="handleVerify">
        <div class="form-group">
          <label class="form-label">Reference Number</label>
          <input v-model="refNumber" class="form-input" placeholder="ZNC2607000214" />
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%" :disabled="loading">{{ loading ? 'Verifying...' : 'Verify & Continue' }}</button>
      </form>
      <div v-if="error" class="alert alert-error mt-4">{{ error }}</div>
    </div>
    <div v-else-if="step === 'reschedule'" class="card form-card">
      <h2>Select New Schedule</h2>
      <p class="text-sm text-muted mb-2">Current: {{ formatDate(appointment.appointment_date) }} @ {{ formatTime(appointment.start_time) }}</p>
      <div class="form-group">
        <label class="form-label">New Date</label>
        <input v-model="newDate" type="date" class="form-input" :min="minDate" />
      </div>
      <div v-if="newDate" class="form-group">
        <label class="form-label">New Time</label>
        <div class="slots-grid">
          <button v-for="slot in slots" :key="slot.start_time"
            class="slot-btn"
            :class="{ 'slot-selected': newTime === slot.start_time, 'slot-full': !slot.available }"
            :disabled="!slot.available"
            @click="newTime = slot.start_time"
          >{{ formatTime(slot.start_time) }}</button>
        </div>
      </div>
      <div class="flex gap-4 mt-4">
        <button class="btn btn-secondary" style="flex:1" @click="step = 'verify'">Back</button>
        <button class="btn btn-primary" style="flex:1" :disabled="!newDate || !newTime || submitting" @click="handleReschedule">
          {{ submitting ? 'Rescheduling...' : 'Confirm Reschedule' }}
        </button>
      </div>
      <div v-if="error" class="alert alert-error mt-4">{{ error }}</div>
    </div>
    <div v-else-if="step === 'done'" class="card form-card text-center">
      <div class="success-icon">✓</div>
      <h2>Appointment Rescheduled</h2>
      <p class="text-muted mt-2">Your appointment has been rescheduled successfully.</p>
      <div class="mt-6 flex gap-4">
        <router-link to="/view" class="btn btn-secondary" style="flex:1">View Details</router-link>
        <router-link to="/" class="btn btn-primary" style="flex:1">Go Home</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { consumerApi } from '../../api/consumer'
import { formatDate, formatTime } from '../../utils/formatters'

const route = useRoute()
const step = ref('verify')
const refNumber = ref(route.query.ref || '')
const appointment = ref(null)
const newDate = ref('')
const newTime = ref('')
const slots = ref([])
const loadingSlots = ref(false)
const slotsError = ref('')
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const minDate = new Date().toISOString().split('T')[0]
const lastFetchedDate = ref('')

watch(newDate, () => {
  newTime.value = ''
  lastFetchedDate.value = newDate.value
  if (newDate.value) loadSlots()
})

async function handleVerify() {
  if (!refNumber.value) { error.value = 'Please enter your reference number'; return }
  loading.value = true; error.value = ''
  try {
    const { data } = await consumerApi.getAppointment(refNumber.value.trim())
    appointment.value = data.data
    step.value = 'reschedule'
  } catch {
    // Fallback: check localStorage for mock appointments
    try {
      const stored = JSON.parse(localStorage.getItem('zaneco_mock_appts') || '{}')
      const mock = stored[refNumber.value.trim()]
      if (mock) {
        appointment.value = mock
        step.value = 'reschedule'
      } else {
        error.value = 'Verification failed. Please check your details.'
      }
    } catch (err) {
      console.error('Mock appointment lookup failed:', err)
      error.value = 'Verification failed. Please check your details.'
    }
  } finally {
    loading.value = false
  }
}

function generateMockSlots(date) {
  const day = new Date(date + 'T00:00:00').getDay()
  if (day === 0 || day === 6) return []
  return ['08:00:00','08:30:00','09:00:00','09:30:00','10:00:00','10:30:00','11:00:00','11:30:00','13:00:00','13:30:00','14:00:00','14:30:00','15:00:00','15:30:00','16:00:00','16:30:00'].map((t, i) => ({
    start_time: t, end_time: '17:00:00', available: i % 3 !== 2,
  }))
}

async function loadSlots() {
  const date = newDate.value
  if (!appointment.value?.office_id || !date) return
  loadingSlots.value = true
  slotsError.value = ''
  try {
    const { data } = await consumerApi.getTimeSlots(appointment.value.office_id, date)
    if (lastFetchedDate.value !== date) return
    slots.value = (data.data?.slots || []).filter(s => s.available !== false)
  } catch (err) {
    if (lastFetchedDate.value !== date) return
    console.error('Failed to load slots:', err)
    slots.value = []
  } finally {
    if (lastFetchedDate.value === date) loadingSlots.value = false
  }
}

async function handleReschedule() {
  submitting.value = true; error.value = ''
  try {
    await consumerApi.rescheduleAppointment(refNumber.value.trim(), {
      new_date: newDate.value,
      new_start_time: newTime.value,
    })
    step.value = 'done'
  } catch (err) {
    // Fallback: update mock appointment in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('zaneco_mock_appts') || '{}')
      if (stored[refNumber.value.trim()]) {
        stored[refNumber.value.trim()].appointment_date = newDate.value
        stored[refNumber.value.trim()].start_time = newTime.value
        stored[refNumber.value.trim()].status = 'rescheduled'
        localStorage.setItem('zaneco_mock_appts', JSON.stringify(stored))
        step.value = 'done'
      } else {
        error.value = err.response?.data?.error?.message || 'Reschedule failed.'
      }
    } catch {
      error.value = err.response?.data?.error?.message || 'Reschedule failed.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.form-card { max-width: 560px; margin: 0 auto; }
.form-card h2 { font-size: var(--font-size-xl); }
.alert-error {
  background-color: var(--color-danger-light); color: var(--color-danger);
  padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: var(--font-size-sm);
}
.slots-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
.slot-btn {
  padding: 0.5rem; border: 1px solid var(--color-gray-300); border-radius: var(--radius-md);
  background: var(--color-white); font-size: var(--font-size-sm); cursor: pointer; text-align: center;
}
.slot-btn:hover:not(:disabled) { border-color: var(--color-primary); background-color: var(--color-primary-light); }
.slot-selected { border-color: var(--color-primary); background-color: var(--color-primary); color: var(--color-white); }
.slot-full { background-color: var(--color-gray-100); color: var(--color-gray-400); cursor: not-allowed; }
.success-icon {
  width: 64px; height: 64px; border-radius: 50%; background-color: var(--color-success);
  color: var(--color-white); font-size: 2rem; display: flex; align-items: center;
  justify-content: center; margin: 0 auto 1rem;
}
</style>
