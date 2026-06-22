<template>
  <div class="container">
    <Stepper :steps="['Info', 'Concern & Office', 'Schedule', 'Review']" :currentStep="3" />
    <div class="card form-card">
      <h2>Select Date and Time</h2>
      <p class="text-sm text-muted mb-6">Choose your preferred appointment date and available time slot</p>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div class="date-section">
        <label class="form-label">Select Date</label>
        <div class="calendar-nav">
          <button class="btn btn-sm btn-secondary" @click="changeMonth(-1)">◀</button>
          <span class="month-label">{{ currentMonthLabel }}</span>
          <button class="btn btn-sm btn-secondary" @click="changeMonth(1)">▶</button>
        </div>
        <div class="calendar-grid">
          <span v-for="day in dayHeaders" :key="day" class="cal-header">{{ day }}</span>
          <span v-for="(d, i) in calendarDays" :key="i"
            class="cal-day"
            :class="{
              'cal-day-empty': !d,
              'cal-day-selected': d?.date === selectedDate,
              'cal-day-today': d?.isToday,
              'cal-day-disabled': d?.isPast || d?.isWeekend || d?.isBooked || d?.isBeyondLimit,
            }"
            @click="d && !d.isPast && !d.isWeekend && !d.isBeyondLimit && selectDate(d.date)"
          >
            {{ d?.day || '' }}
          </span>
        </div>
      </div>
      <div v-if="selectedDate" class="time-section">
        <label class="form-label">Available Time Slots for {{ selectedDate }}</label>
        <div v-if="slotsLoading" class="text-sm text-muted">Loading available slots...</div>
        <div v-else-if="slots.length === 0" class="text-sm text-muted">No available slots for this date.</div>
        <div v-else class="slots-grid">
          <button
            v-for="slot in slots"
            :key="slot.start_time"
            class="slot-btn"
            :class="{ 'slot-selected': selectedTime === slot.start_time, 'slot-full': !slot.available }"
            :disabled="!slot.available"
            @click="selectTime(slot.start_time)"
          >
            {{ formatTime(slot.start_time) }}
          </button>
        </div>
      </div>
      <div class="flex gap-4 mt-6">
        <router-link to="/book/step2" class="btn btn-secondary" style="flex:1">Previous</router-link>
        <button class="btn btn-primary" style="flex:1" :disabled="!selectedDate || !selectedTime || submitting" @click="handleConfirm">
          {{ submitting ? 'Confirming...' : 'Review & Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '../../stores/booking'
import { consumerApi } from '../../api/consumer'
import { format } from 'date-fns'
import Stepper from '../../components/common/Stepper.vue'
import { formatTime } from '../../utils/formatters'

const router = useRouter()
const store = useBookingStore()
const selectedDate = ref('')
const selectedTime = ref('')
const slots = ref([])
const slotsLoading = ref(false)
const error = ref('')
const submitting = ref(false)

const now = new Date()
const currentMonth = ref(now.getMonth())
const currentYear = ref(now.getFullYear())

const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const currentMonthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value)
  return format(d, 'MMMM yyyy')
})

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear.value, currentMonth.value, d)
    const dateStr = format(dateObj, 'yyyy-MM-dd')
    const isPast = dateObj < today
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
    const isBeyondLimit = dateObj > maxDate
    days.push({ day: d, date: dateStr, isPast, isWeekend, isToday: dateObj.getTime() === today.getTime(), isBeyondLimit })
  }
  return days
})

function changeMonth(delta) {
  currentMonth.value += delta
  if (currentMonth.value < 0) { currentMonth.value = 11; currentYear.value-- }
  if (currentMonth.value > 11) { currentMonth.value = 0; currentYear.value++ }
}

function generateMockSlots(date) {
  const day = new Date(date + 'T00:00:00').getDay()
  if (day === 0 || day === 6) return []
  const slots = []
  const times = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30']
  times.forEach((t, i) => {
    slots.push({
      start_time: t + ':00',
      end_time: times[i + 1] ? times[i + 1] + ':00' : '17:00:00',
      available: i % 3 !== 2,
    })
  })
  return slots
}

async function selectDate(date) {
  selectedDate.value = date
  selectedTime.value = ''
  slotsLoading.value = true
  try {
    const { data } = await consumerApi.getTimeSlots(store.officeId, date)
    slots.value = data.data.slots
  } catch {
    slots.value = generateMockSlots(date)
  } finally {
    slotsLoading.value = false
  }
}

function selectTime(time) {
  selectedTime.value = time
}

async function handleConfirm() {
  if (!selectedDate.value || !selectedTime.value) return
  store.setDateTime(selectedDate.value, selectedTime.value)
  submitting.value = true
  try {
    await store.submitBooking()
    router.push('/book/confirm')
  } catch (err) {
    error.value = store.error || 'Booking failed. Please try again.'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (!store.consumerName || !store.officeId) router.push('/book')
})
</script>

<style scoped>
.form-card { max-width: 640px; margin: 0 auto; }
.form-card h2 { font-size: var(--font-size-xl); margin-bottom: 0.25rem; }
.alert-error {
  background-color: var(--color-danger-light);
  color: var(--color-danger);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  font-size: var(--font-size-sm);
}
.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.month-label { font-weight: 600; font-size: var(--font-size-base); }
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 1.5rem;
}
.cal-header {
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-gray-500);
  padding: 0.5rem 0;
}
.cal-day {
  text-align: center;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
}
.cal-day:hover:not(.cal-day-disabled):not(.cal-day-empty) {
  background-color: var(--color-primary-light);
}
.cal-day-empty { cursor: default; }
.cal-day-today { font-weight: 700; }
.cal-day-selected {
  background-color: var(--color-primary) !important;
  color: var(--color-white) !important;
  font-weight: 600;
}
.cal-day-disabled {
  color: var(--color-gray-300);
  cursor: not-allowed;
}
.slots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.slot-btn {
  padding: 0.625rem;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  background-color: var(--color-white);
  font-size: var(--font-size-sm);
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}
.slot-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
}
.slot-selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
  color: var(--color-white);
}
.slot-full {
  background-color: var(--color-gray-100);
  color: var(--color-gray-400);
  cursor: not-allowed;
  text-decoration: line-through;
}
@media (max-width: 768px) {
  .slots-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
