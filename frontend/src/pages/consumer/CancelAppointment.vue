<template>
  <div class="container">
    <div class="card form-card" v-if="step === 'verify'">
      <h2>Cancel Appointment</h2>
      <p class="text-sm text-muted mb-4">Enter your reference number to find your appointment</p>
      <form @submit.prevent="handleVerify">
        <div class="form-group">
          <label class="form-label">Reference Number</label>
          <input v-model="refNumber" class="form-input" placeholder="ZNC2607000214" />
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%" :disabled="loading">{{ loading ? 'Finding...' : 'Verify & Continue' }}</button>
      </form>
      <div v-if="error" class="alert alert-error mt-4">{{ error }}</div>
    </div>
    <div v-else-if="step === 'confirm'" class="card form-card">
      <h2>Confirm Cancellation</h2>
      <p class="text-muted mt-2 mb-4">Are you sure you want to cancel this appointment?</p>
      <div class="details-box">
        <p><strong>Appointment:</strong> {{ formatDate(appointment.appointment_date) }} @ {{ formatTime(appointment.start_time) }}</p>
        <p><strong>Office:</strong> {{ appointment.office }}</p>
        <p><strong>Status:</strong> <StatusBadge :status="appointment.status" /></p>
      </div>
      <div class="flex gap-4 mt-6">
        <button class="btn btn-secondary" style="flex:1" @click="step = 'verify'">No, Keep It</button>
        <button class="btn btn-danger" style="flex:1" :disabled="submitting" @click="handleCancel">
          {{ submitting ? 'Cancelling...' : 'Yes, Cancel Appointment' }}
        </button>
      </div>
      <div v-if="error" class="alert alert-error mt-4">{{ error }}</div>
    </div>
    <div v-else-if="step === 'done'" class="card form-card text-center">
      <div class="cancelled-icon">✕</div>
      <h2>Appointment Cancelled</h2>
      <p class="text-muted mt-2">Your appointment has been cancelled successfully.</p>
      <p class="text-sm text-muted mt-2">A cancellation notice has been sent to your email.</p>
      <div class="mt-6 flex gap-4">
        <router-link to="/book" class="btn btn-primary" style="flex:1">Book New Appointment</router-link>
        <router-link to="/" class="btn btn-secondary" style="flex:1">Go Home</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { consumerApi } from '../../api/consumer'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { formatDate, formatTime } from '../../utils/formatters'

const route = useRoute()
const step = ref('verify')
const refNumber = ref(route.query.ref || '')
const appointment = ref(null)
const loading = ref(false)
const submitting = ref(false)
const error = ref('')

async function handleVerify() {
  if (!refNumber.value) { error.value = 'Please enter your reference number'; return }
  loading.value = true; error.value = ''
  try {
    const { data } = await consumerApi.getAppointment(refNumber.value.trim())
    appointment.value = data.data
    step.value = 'confirm'
  } catch (err) {
    console.error('Failed to verify appointment:', err)
    error.value = 'Appointment not found. Please check your details.'
  } finally {
    loading.value = false
  }
}

async function handleCancel() {
  submitting.value = true; error.value = ''
  try {
    await consumerApi.cancelAppointment(refNumber.value.trim(), {})
    step.value = 'done'
  } catch (err) {
    error.value = err.response?.data?.error?.message || 'Cancellation failed.'
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
.details-box {
  background-color: var(--color-gray-50); padding: 1rem; border-radius: var(--radius-md);
}
.details-box p { font-size: var(--font-size-sm); margin-bottom: 0.25rem; }
.cancelled-icon {
  width: 64px; height: 64px; border-radius: 50%; background-color: var(--color-danger);
  color: var(--color-white); font-size: 2rem; display: flex; align-items: center;
  justify-content: center; margin: 0 auto 1rem;
}
</style>
