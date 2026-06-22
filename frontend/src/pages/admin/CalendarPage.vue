<template>
  <div>
    <header class="ap-header">
      <div class="ap-header-left">
        <h2 class="header-title">Calendar</h2>
      </div>
    </header>

    <div class="ap-content">
      <div class="cal-card">
        <div class="cal-nav">
          <button class="cal-nav-btn" @click="changeMonth(-1)"><span class="material-symbols-outlined">chevron_left</span></button>
          <span class="cal-month-label">{{ format(currentView, 'MMMM yyyy') }}</span>
          <button class="cal-nav-btn" @click="changeMonth(1)"><span class="material-symbols-outlined">chevron_right</span></button>
          <button class="cal-today-btn" @click="today">Today</button>
        </div>

        <div class="cal-grid">
          <span v-for="d in dayHeaders" :key="d" class="cal-grid-header">{{ d }}</span>
          <div v-for="(cell, i) in calendarDays" :key="i"
            class="cal-cell"
            :class="{ 'cal-cell-other': !cell?.isCurrent, 'cal-cell-today': cell?.isToday, 'cal-cell-selected': cell?.date === selectedDate }"
            @click="cell?.isCurrent && selectDate(cell.date)"
          >
            <span class="cal-day-num">{{ cell?.day || '' }}</span>
            <div v-if="cell?.count" class="cal-dot">{{ cell.count }}</div>
          </div>
        </div>
      </div>

      <div v-if="selectedDate" class="ap-table-wrap" style="margin-top:1rem">
        <div style="padding:0.75rem 1rem;font-weight:600;font-size:0.875rem;border-bottom:1px solid #c4c5d5;background:#eef4ff">
          Appointments for {{ selectedDate }}
        </div>
        <div class="ap-table-scroll">
          <table class="ap-table">
            <thead>
              <tr><th>Time</th><th>Consumer</th><th>Concern</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-for="apt in selectedAppointments" :key="apt.id" class="ap-row" @click="$router.push(`/admin/appointments/${apt.id}`)" style="cursor:pointer">
                <td class="td-date">{{ apt.start_time?.slice(0,5) }}</td>
                <td class="td-name">{{ apt.consumer_name }}</td>
                <td class="td-muted">{{ apt.concern_type }}</td>
                <td><span class="status-badge" :class="'status-' + apt.status">{{ statusLabel(apt.status) }}</span></td>
              </tr>
              <tr v-if="selectedAppointments.length === 0"><td colspan="4" class="td-empty">No appointments on this day.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <LoadingSpinner v-if="loading" :visible="loading" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi } from '../../api/admin'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { statusLabel } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const router = useRouter()

const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const currentView = ref(new Date())
const selectedDate = ref(null)
const appointments = ref([])
const loading = ref(true)

const calendarDays = computed(() => {
  const start = startOfWeek(startOfMonth(currentView.value))
  const end = endOfWeek(endOfMonth(currentView.value))
  return eachDayOfInterval({ start, end }).map(d => ({
    day: d.getDate(),
    date: format(d, 'yyyy-MM-dd'),
    isCurrent: isSameMonth(d, currentView.value),
    isToday: isToday(d),
    count: appointments.value.filter(a => a.appointment_date === format(d, 'yyyy-MM-dd')).length,
  }))
})

const selectedAppointments = computed(() =>
  appointments.value.filter(a => a.appointment_date === selectedDate.value)
)

function selectDate(date) { selectedDate.value = date }
function today() { currentView.value = new Date() }
function changeMonth(delta) { currentView.value = delta > 0 ? addMonths(currentView.value, 1) : subMonths(currentView.value, 1) }

onMounted(async () => {
  try {
    const ms = format(startOfMonth(currentView.value), 'yyyy-MM-dd')
    const me = format(endOfMonth(currentView.value), 'yyyy-MM-dd')
    const { data } = await adminApi.getAppointments({ date_from: ms, date_to: me, per_page: 200 })
    appointments.value = data.data.appointments || []
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.header-title { font-size: 1.25rem; font-weight: 600; color: #121c28; }
.ap-header { position: sticky; top: 0; z-index: 20; background-color: #f8f9ff; border-bottom: 1px solid rgba(196,197,213,0.3); padding: 0.75rem 1.5rem; display: flex; align-items: center; }
.ap-header-left { display: flex; align-items: center; gap: 0.75rem; }
.menu-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: none; border-radius: 50%; color: #121c28; cursor: pointer; margin-left: -0.5rem; }
.menu-btn:hover { background-color: #dfe9fa; }
@media (min-width: 1024px) { .menu-btn { display: none; } }

.ap-content { padding: 1.5rem; }

/* Calendar card */
.cal-card { background-color: var(--color-white); border: 1px solid #c4c5d5; border-radius: var(--radius-xl); padding: 1.25rem; }
.cal-nav { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
.cal-nav-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 1px solid #c4c5d5; background: none; border-radius: 50%; color: #444653; cursor: pointer; }
.cal-nav-btn:hover { background-color: #dfe9fa; }
.cal-nav-btn .material-symbols-outlined { font-size: 1.25rem; }
.cal-month-label { font-size: 1.125rem; font-weight: 700; color: #121c28; flex: 1; }
.cal-today-btn { padding: 0.375rem 0.875rem; border: 1px solid #c4c5d5; background: none; border-radius: 9999px; font-size: 0.8125rem; font-weight: 600; color: #444653; cursor: pointer; }
.cal-today-btn:hover { background-color: #dfe9fa; }

.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background-color: #e5e7eb; border: 1px solid #e5e7eb; border-radius: var(--radius-lg); overflow: hidden; }
.cal-grid-header { background-color: #f9fafb; text-align: center; padding: 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6b7280; }
.cal-cell { background-color: var(--color-white); min-height: 80px; padding: 0.375rem; cursor: pointer; position: relative; }
.cal-cell:hover { background-color: #f9fafb; }
.cal-cell-other { opacity: 0.35; }
.cal-cell-today .cal-day-num { background-color: var(--color-primary); color: var(--color-white); border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.cal-cell-selected { outline: 2px solid var(--color-primary); outline-offset: -2px; border-radius: 4px; }
.cal-day-num { font-size: 0.875rem; font-weight: 500; color: #121c28; }
.cal-dot { position: absolute; top: 0.25rem; right: 0.25rem; background-color: var(--color-primary-light); color: var(--color-primary); font-size: 10px; font-weight: 700; padding: 0.125rem 0.375rem; border-radius: 9999px; line-height: 1.2; }

/* Appointments table */
.ap-table-wrap { background-color: var(--color-white); border: 1px solid #c4c5d5; border-radius: var(--radius-xl); overflow: hidden; }
.ap-table-scroll { overflow-x: auto; }
.ap-table { width: 100%; min-width: 500px; border-collapse: collapse; }
.ap-table th { padding: 0.75rem 1.25rem; background-color: #eef4ff; border-bottom: 1px solid #c4c5d5; font-size: 0.75rem; font-weight: 600; color: #444653; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
.ap-table td { padding: 0.625rem 1.25rem; font-size: 0.875rem; border-bottom: 1px solid rgba(196,197,213,0.3); }
.ap-row:hover td { background-color: #eef4ff; }
.td-name { font-weight: 600; color: #121c28; }
.td-muted { color: #444653; }
.td-date { color: #121c28; }
.td-empty { text-align: center; color: #757684; padding: 1.5rem; }

/* Status badges */
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; }
.status-pending { background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.status-confirmed { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.status-rescheduled { background-color: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
.status-cancelled { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.status-completed { background-color: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db; }
.status-no_show { background-color: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
</style>
