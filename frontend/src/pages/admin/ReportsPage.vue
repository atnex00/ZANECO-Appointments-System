<template>
  <div>
    <header class="ap-header">
      <div class="ap-header-left">
        <h2 class="header-title">Reports & Analytics</h2>
      </div>
    </header>

    <div class="ap-content">
      <div class="report-filter-card">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Report Type</label>
            <select v-model="reportType" class="form-select">
              <option value="appointments-by-office">Appointments by Office</option>
              <option value="appointments-by-concern">Appointments by Concern Type</option>
              <option value="daily">Daily Appointments</option>
              <option value="weekly">Weekly Appointments</option>
              <option value="monthly">Monthly Appointments</option>
              <option value="summary">Summary Statistics</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date From</label>
            <input v-model="dateFrom" type="date" class="form-select" />
          </div>
          <div class="form-group">
            <label class="form-label">Date To</label>
            <input v-model="dateTo" type="date" class="form-select" />
          </div>
          <div class="form-group">
            <label class="form-label">Office</label>
            <select v-model="officeId" class="form-select">
              <option value="">All Offices</option>
              <option v-for="o in offices" :key="o.id" :value="o.id">{{ o.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Concern Type</label>
            <select v-model="concernTypeId" class="form-select">
              <option value="">All Concerns</option>
              <option v-for="c in concernTypes" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
        </div>
        <div class="filter-actions">
          <button class="ap-new-btn" @click="generateReport" :disabled="loading">
            <span class="material-symbols-outlined">description</span>
            {{ loading ? 'Generating...' : 'Generate Report' }}
          </button>
          <button class="ap-export-btn" :disabled="!reportData" @click="exportReport('pdf')" title="Export PDF">
            <span class="material-symbols-outlined">picture_as_pdf</span>
          </button>
          <button class="ap-export-btn" :disabled="!reportData" @click="exportReport('csv')" title="Export CSV">
            <span class="material-symbols-outlined">table_chart</span>
          </button>
        </div>
      </div>

      <LoadingSpinner :visible="loading" />

      <div v-if="reportData && !loading" class="ap-table-wrap" style="margin-top:1.5rem">
        <div class="ap-title-row">
          <div>
            <h2 class="ap-title">{{ reportTitle }}</h2>
          </div>
        </div>
        <div class="ap-table-scroll">
          <table class="ap-table">
            <thead>
              <tr>
                <th v-for="col in displayColumns" :key="col.key">{{ col.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in reportData" :key="i" class="ap-row">
                <td v-for="col in displayColumns" :key="col.key" class="td-date">{{ row[col.key] }}</td>
              </tr>
              <tr v-if="reportData.length === 0"><td :colspan="displayColumns.length" class="td-empty">No data matching the selected filters.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, subDays } from 'date-fns'
import { adminApi } from '../../api/admin'
import { useToast } from '../../composables/useToast'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const { error: toastError } = useToast()

const COLUMN_LABELS = {
  office: 'Office',
  total: 'Total',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  no_show: 'No Show',
  rescheduled: 'Rescheduled',
  pending: 'Pending',
  confirmed: 'Confirmed',
  concern_type: 'Concern Type',
  appointment_date: 'Date',
  week: 'Week',
  month: 'Month',
  date: 'Date',
  count: 'Count',
  total_today: 'Today',
  total_week: 'This Week',
  total_month: 'This Month',
}

const reportType = ref('appointments-by-office')
const dateFrom = ref(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
const dateTo = ref(format(new Date(), 'yyyy-MM-dd'))
const officeId = ref('')
const concernTypeId = ref('')
const reportData = ref(null)
const loading = ref(false)
const offices = ref([])
const concernTypes = ref([])

const reportTitles = {
  'appointments-by-office': 'Appointments by Office',
  'appointments-by-concern': 'Appointments by Concern Type',
  daily: 'Daily Appointments',
  weekly: 'Weekly Appointments',
  monthly: 'Monthly Appointments',
  summary: 'Summary Statistics',
}
const reportTitle = computed(() => reportTitles[reportType.value])

const displayColumns = computed(() => {
  if (!reportData.value?.length) return []
  const keys = Object.keys(reportData.value[0])
  return keys.map(key => ({ key, label: COLUMN_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))
})

onMounted(async () => {
  try {
    const [offRes, ctRes] = await Promise.all([adminApi.getOffices(), adminApi.getConcernTypes()])
    offices.value = offRes.data.data || offRes.data
    concernTypes.value = ctRes.data.data || ctRes.data
  } catch (err) { console.error('Fetch reports metadata failed:', err) }
})

async function generateReport() {
  loading.value = true
  try {
    const params = { date_from: dateFrom.value, date_to: dateTo.value }
    if (officeId.value) params.office_id = officeId.value
    if (concernTypeId.value) params.concern_type_id = concernTypeId.value
    const { data } = await adminApi.getReports(reportType.value, params)
    reportData.value = data.data
  } catch (err) {
    console.error('Failed to generate report:', err)
    reportData.value = null
    toastError('Failed to generate report')
  } finally {
    loading.value = false
  }
}

async function exportReport(format) {
  try {
    const params = { date_from: dateFrom.value, date_to: dateTo.value }
    if (officeId.value) params.office_id = officeId.value
    if (concernTypeId.value) params.concern_type_id = concernTypeId.value
    const res = await adminApi.exportReport(reportType.value, format, params)
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const office = officeId.value ? (offices.value.find(o => o.id === Number(officeId.value))?.name || 'selected') : 'all-offices'
    const officeSlug = office.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    link.download = `appointment-reports-zaneco-${officeSlug}-${ts}.${format}`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Failed to export ' + format.toUpperCase(), err)
    toastError(`Failed to export ${format.toUpperCase()}`)
  }
}
</script>

<style scoped>
.header-title { font-size: 1.25rem; font-weight: 600; color: var(--color-gray-900); white-space: nowrap; }

.ap-header { position: sticky; top: 0; z-index: 20; background-color: var(--color-primary-light); border-bottom: 1px solid rgba(196,197,213,0.3); padding: 0.75rem 1.5rem; display: flex; align-items: center; }
.ap-header-left { display: flex; align-items: center; gap: 0.75rem; }

.ap-content { padding: 1.5rem; }

.ap-title-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; }
.ap-title { font-size: 1.75rem; font-weight: 700; color: var(--color-gray-900); }

.ap-table-wrap { background-color: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; }
.ap-table-scroll { overflow-x: auto; }
.ap-table { width: 100%; min-width: 700px; border-collapse: collapse; }
.ap-table th { padding: 1rem 1.25rem; background-color: var(--color-primary-muted); border-bottom: 1px solid var(--color-border); font-size: 0.75rem; font-weight: 600; color: var(--color-gray-600); text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
.ap-table td { padding: 0.75rem 1.25rem; font-size: 0.875rem; border-bottom: 1px solid rgba(196,197,213,0.3); }
.ap-row:hover td { background-color: var(--color-primary-muted); }
.td-date { color: var(--color-gray-900); }
.td-empty { text-align: center; color: var(--color-gray-400); padding: 2rem; }

.ap-new-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: var(--radius-xl); background-color: var(--color-primary); border: none; color: var(--color-white); font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
.ap-new-btn:hover { filter: brightness(1.1); }
.ap-new-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.ap-export-btn { padding: 0.5rem; border: 1px solid var(--color-border); background: none; border-radius: var(--radius-xl); color: var(--color-gray-600); cursor: pointer; }
.ap-export-btn:hover { background-color: var(--color-primary-muted); }
.ap-export-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.report-filter-card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-gray-600);
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.form-select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-white);
  color: var(--color-gray-900);
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}

.form-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(196, 197, 213, 0.3);
}
</style>
