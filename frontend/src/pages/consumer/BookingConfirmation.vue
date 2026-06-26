<template>
  <div class="container">
    <Stepper :steps="['Info', 'Concern', 'Location', 'Schedule', 'Review']" :currentStep="5" />
    <div class="card confirm-card" v-if="appointment">
      <div class="success-icon">
        <span class="material-symbols-outlined">check_circle</span>
      </div>
      <h2>Appointment Booked!</h2>

      <div class="ref-box">
        <span class="ref-label">Reference Number</span>
        <span class="ref-number">{{ appointment.reference_number }}</span>
        <span class="text-xs text-muted">Please save this number for future reference</span>
      </div>

      <div class="summary-card">
        <div class="summary-header">
          <span class="material-symbols-outlined">assignment_turned_in</span>
          <span class="font-bold">Appointment Summary</span>
        </div>
        <div class="zebra-stripes">
          <div class="summary-row"><span class="summary-label">Consumer</span><span class="font-bold">{{ appointment.consumer_name }}</span></div>
          <div class="summary-row"><span class="summary-label">Account No.</span><span>{{ appointment.account_number }}</span></div>
          <div class="summary-row"><span class="summary-label">Concern</span><span>{{ appointment.concern_type }}</span></div>
          <div class="summary-row"><span class="summary-label">Location</span><span>{{ appointment.office }}</span></div>
          <div class="summary-row">
            <span class="summary-label">Schedule</span>
            <div class="text-right">
              <p class="font-bold">{{ formatDate(appointment.appointment_date) }}</p>
              <p class="text-sm" style="color:var(--color-primary);font-weight:600">{{ formatTime(appointment.start_time) }} - {{ formatTime(appointment.end_time) }}</p>
            </div>
          </div>
          <div class="summary-row"><span class="summary-label">Status</span><span><StatusBadge :status="appointment.status" /></span></div>
        </div>
      </div>

      <p class="text-sm text-muted">
        A confirmation email has been sent to {{ appointment.email }}.
      </p>

      <div class="flex gap-4 mt-6">
        <router-link to="/view" class="btn btn-secondary" style="flex:1">View Details</router-link>
        <router-link to="/book" class="btn btn-primary" style="flex:1">Book Another</router-link>
      </div>

      <div class="reminders mt-6">
        <p class="text-sm font-bold">Reminders:</p>
        <ul class="text-sm text-muted">
          <li>Please arrive 10 minutes before your schedule</li>
          <li>Bring your valid ID and latest electric bill</li>
          <li>You can reschedule or cancel using your reference number</li>
        </ul>
      </div>
    </div>
    <div v-else class="card confirm-card text-center">
      <p class="text-muted">No confirmation data found.</p>
      <router-link to="/book" class="btn btn-primary mt-4">Book an Appointment</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBookingStore } from '../../stores/booking'
import Stepper from '../../components/common/Stepper.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { formatDate, formatTime } from '../../utils/formatters'

const store = useBookingStore()
const appointment = computed(() => store.appointmentResult)
</script>

<style scoped>
.confirm-card {
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
}
.success-icon {
  margin: 0 auto 1rem;
}
.success-icon .material-symbols-outlined {
  font-size: 3.5rem;
  color: var(--color-success);
  font-variation-settings: 'FILL' 1;
}
.confirm-card h2 {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  margin-bottom: 1.5rem;
  color: var(--color-success);
  letter-spacing: -0.02em;
}
.ref-box {
  background-color: var(--color-gray-50);
  border: 2px dashed var(--color-gray-300);
  border-radius: var(--radius-xl);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}
.ref-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}
.ref-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-gray-900);
}
.summary-card {
  background-color: var(--color-gray-50);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  text-align: left;
  margin-bottom: 1.5rem;
}
.summary-header {
  padding: 0.75rem 1rem;
  background-color: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--font-size-sm);
}
.summary-header .material-symbols-outlined {
  color: var(--color-primary);
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--color-border);
}
.summary-row:last-child {
  border-bottom: none;
}
.summary-label {
  color: var(--color-gray-500);
  font-weight: 600;
}
.reminders {
  background-color: var(--color-info-light);
  padding: 1rem;
  border-radius: var(--radius-xl);
  text-align: left;
}
.reminders ul {
  margin-top: 0.5rem;
  padding-left: 1.25rem;
  list-style: disc;
}
.reminders li + li {
  margin-top: 0.25rem;
}
</style>
