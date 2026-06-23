<template>
  <div class="ap-content">
    <div class="ap-title-row">
      <div>
        <h2 class="ap-title">Dashboard</h2>
        <p class="ap-subtitle">Welcome, {{ auth.user?.full_name || 'Admin' }}</p>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card"><span class="stat-label">TODAY</span><span class="stat-value" style="color:var(--color-primary)">{{ summary?.total_today ?? '-' }}</span></div>
      <div class="stat-card"><span class="stat-label">PENDING</span><span class="stat-value" style="color:var(--color-warning)">{{ summary?.pending ?? '-' }}</span></div>
      <div class="stat-card"><span class="stat-label">COMPLETED</span><span class="stat-value" style="color:var(--color-success)">{{ summary?.completed ?? '-' }}</span></div>
      <div class="stat-card"><span class="stat-label">CANCELLED</span><span class="stat-value" style="color:var(--color-danger)">{{ summary?.cancelled ?? '-' }}</span></div>
      <div class="stat-card"><span class="stat-label">REJECTED</span><span class="stat-value" style="color:#991b1b">{{ summary?.rejected ?? '-' }}</span></div>
    </div>

    <div v-if="!loading" class="chart-row">
      <div class="chart-card">
        <h3 class="chart-title">Weekly Overview</h3>
        <Bar v-if="barData" :data="barData" :options="barOptions" />
        <p v-else class="text-sm muted">No data this week.</p>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">Quick Actions</h3>
        <div class="quick-actions">
          <router-link to="/admin/appointments" class="dash-btn dash-btn-primary">View All Appointments</router-link>
          <router-link to="/admin/calendar" class="dash-btn dash-btn-outline">Calendar View</router-link>
          <router-link to="/admin/reports" class="dash-btn dash-btn-outline">Generate Report</router-link>
        </div>
      </div>
    </div>

    <!-- Recent Appointments -->
    <div v-if="recentAppts.length" class="recent-section">
      <div class="recent-header">
        <h3 class="chart-title">Recent Appointments</h3>
        <router-link to="/admin/appointments" class="view-all-link">View All →</router-link>
      </div>
      <div class="ap-table-wrap">
        <div class="ap-table-scroll">
          <table class="ap-table">
            <thead>
              <tr><th>Ref #</th><th>Consumer</th><th>Date</th><th>Time</th><th>Status</th><th class="th-right">Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="apt in recentAppts" :key="apt.id" class="ap-row">
                <td class="td-ref">{{ apt.reference_number }}</td>
                <td class="td-name">{{ apt.consumer_name }}</td>
                <td class="td-date">{{ apt.appointment_date }}</td>
                <td class="td-date">{{ apt.start_time?.slice(0,5) }}</td>
                <td><span class="status-badge" :class="'status-' + apt.status">{{ statusLabel(apt.status) }}</span></td>
                <td class="td-actions">
                  <router-link :to="`/admin/appointments/${apt.id}`" class="row-action" title="View"><span class="material-symbols-outlined">visibility</span></router-link>
                  <button v-if="apt.status === 'pending'" class="row-action" @click="quickAction(apt.id, 'confirmed', $event)" title="Confirm"><span class="material-symbols-outlined">check_circle</span></button>
                  <button v-if="apt.status === 'confirmed'" class="row-action" @click="quickAction(apt.id, 'completed', $event)" title="Complete"><span class="material-symbols-outlined">task_alt</span></button>
                  <button v-if="apt.status === 'pending'" class="row-action" @click="quickAction(apt.id, 'rejected', $event)" title="Reject" style="color:#991b1b"><span class="material-symbols-outlined">block</span></button>
                  <button v-if="['pending','confirmed'].includes(apt.status)" class="row-action" @click="quickAction(apt.id, 'cancelled', $event)" title="Cancel" style="color:#dc2626"><span class="material-symbols-outlined">cancel</span></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" :visible="loading" message="Loading dashboard..." />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { adminApi } from '../../api/admin'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { statusLabel } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const router = useRouter()
const auth = useAuthStore()
const summary = ref(null)
const recentAppts = ref([])
const loading = ref(true)

const barData = computed(() => {
  if (!summary.value?.weekly_trend?.length) return null
  return {
    labels: summary.value.weekly_trend.map(d => new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [{ label: 'Appointments', data: summary.value.weekly_trend.map(d => d.count), backgroundColor: '#d97706', borderRadius: 4, maxBarThickness: 40 }],
  }
})

const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#9ca3af' }, grid: { color: '#e5e7eb' } }, x: { ticks: { color: '#9ca3af' }, grid: { display: false } } },
}

async function quickAction(id, status, event) {
  event.stopPropagation()
  if (status === 'cancelled' && !confirm('Cancel this appointment?')) return
  try {
    await adminApi.updateAppointmentStatus(id, { status })
    // Refresh recent appointments
    const { data } = await adminApi.getAppointments({ per_page: 8, sort_by: 'created_at', sort_order: 'desc' })
    recentAppts.value = data.data.appointments || []
  } catch {}
}

onMounted(async () => {
  try {
    const [sumRes, aptRes] = await Promise.all([
      adminApi.getDashboardSummary(),
      adminApi.getAppointments({ per_page: 8, sort_by: 'created_at', sort_order: 'desc' }),
    ])
    summary.value = sumRes.data.data
    recentAppts.value = aptRes.data.data.appointments || []
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.ap-content { padding: 1.5rem; }
.ap-title-row { margin-bottom: 1.5rem; }
.ap-title { font-size: 1.75rem; font-weight: 700; color: #121c28; }
.ap-subtitle { font-size: 0.875rem; color: #444653; margin-top: 0.25rem; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.stat-card { background-color: #eef4ff; padding: 1rem; border-radius: var(--radius-xl); border: 1px solid #c4c5d5; display: flex; flex-direction: column; justify-content: space-between; min-height: 100px; }
.stat-label { font-size: 0.75rem; font-weight: 600; color: #444653; text-transform: uppercase; letter-spacing: 0.05em; }
.stat-value { font-size: 2rem; font-weight: 700; }
.muted { color: #9ca3af; }

.chart-row { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.chart-card { background-color: var(--color-white); border: 1px solid #c4c5d5; border-radius: var(--radius-xl); padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.chart-title { font-size: 1rem; font-weight: 600; color: #121c28; margin-bottom: 1rem; }
.chart-card :deep(canvas) { max-height: 220px; }
.quick-actions { display: flex; flex-direction: column; gap: 0.75rem; }
.dash-btn { display: block; text-align: center; padding: 0.625rem 1rem; border-radius: var(--radius-lg); font-size: 0.875rem; font-weight: 600; text-decoration: none; transition: all 0.15s; }
.dash-btn-primary { background-color: var(--color-primary); color: var(--color-white); }
.dash-btn-primary:hover { background-color: var(--color-primary-hover); }
.dash-btn-outline { background: var(--color-white); color: #444653; border: 1px solid #c4c5d5; }
.dash-btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }

/* Recent Appointments */
.recent-section { margin-top: 0.5rem; }
.recent-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.view-all-link { font-size: 0.875rem; font-weight: 600; color: var(--color-primary); text-decoration: none; }
.view-all-link:hover { text-decoration: underline; }

.ap-table-wrap { background-color: var(--color-white); border: 1px solid #c4c5d5; border-radius: var(--radius-xl); overflow: hidden; }
.ap-table-scroll { overflow-x: auto; }
.ap-table { width: 100%; min-width: 650px; border-collapse: collapse; }
.ap-table th { padding: 0.75rem 1.25rem; background-color: #eef4ff; border-bottom: 1px solid #c4c5d5; font-size: 0.75rem; font-weight: 600; color: #444653; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
.th-right { text-align: right; }
.ap-table td { padding: 0.625rem 1.25rem; font-size: 0.875rem; border-bottom: 1px solid rgba(196,197,213,0.3); }
.ap-row:hover td { background-color: #eef4ff; }
.td-ref { font-weight: 700; color: var(--color-primary); font-size: 0.8125rem; font-family: monospace; }
.td-name { font-weight: 600; color: #121c28; }
.td-date { color: #121c28; }
.td-actions { text-align: right; white-space: nowrap; }
.row-action { display: inline-flex; padding: 0.375rem; border: none; background: none; border-radius: 50%; color: #444653; cursor: pointer; vertical-align: middle; text-decoration: none; }
.row-action:hover { background-color: #d9e3f4; }

.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; }
.status-pending { background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.status-confirmed { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.status-rescheduled { background-color: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
.status-cancelled { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.status-rejected { background-color: #fce4ec; color: #991b1b; border: 1px solid #f48fb1; }
.status-completed { background-color: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db; }
.status-no_show { background-color: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }

@media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .chart-row { grid-template-columns: 1fr; } }
</style>
