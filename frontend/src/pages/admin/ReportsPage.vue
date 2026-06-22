<template>
  <div>
    <div class="page-header"><h1>Reports & Analytics</h1></div>
    <div class="card mb-4">
      <div class="form-row">
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
          <input v-model="dateFrom" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Date To</label>
          <input v-model="dateTo" type="date" class="form-input" />
        </div>
      </div>
      <div class="flex gap-4">
        <button class="btn btn-primary" @click="generateReport" :disabled="loading">{{ loading ? 'Generating...' : 'Generate Report' }}</button>
        <button class="btn btn-secondary" :disabled="!reportData" @click="exportReport('pdf')">Export PDF</button>
        <button class="btn btn-secondary" :disabled="!reportData" @click="exportReport('excel')">Export Excel</button>
      </div>
    </div>
    <LoadingSpinner :visible="loading" />
    <div v-if="reportData && !loading" class="card">
      <h3 class="card-title">{{ reportTitle }}</h3>
      <table class="report-table">
        <thead>
          <tr><th v-for="col in reportColumns" :key="col">{{ col }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in reportData" :key="i">
            <td v-for="col in reportColumns" :key="col">{{ row[col] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { adminApi } from '../../api/admin'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const reportType = ref('appointments-by-office')
const dateFrom = ref(format(new Date(), 'yyyy-MM-01'))
const dateTo = ref(format(new Date(), 'yyyy-MM-dd'))
const reportData = ref(null)
const loading = ref(false)

const reportTitles = {
  'appointments-by-office': 'Appointments by Office',
  'appointments-by-concern': 'Appointments by Concern Type',
  daily: 'Daily Appointments',
  weekly: 'Weekly Appointments',
  monthly: 'Monthly Appointments',
  summary: 'Summary Statistics',
}
const reportTitle = computed(() => reportTitles[reportType.value])

const reportColumns = computed(() => {
  if (!reportData.value?.length) return []
  return Object.keys(reportData.value[0])
})

async function generateReport() {
  loading.value = true
  try {
    const { data } = await adminApi.getReports(reportType.value, { date_from: dateFrom.value, date_to: dateTo.value })
    reportData.value = data.data
  } catch {
    reportData.value = null
  } finally {
    loading.value = false
  }
}

async function exportReport(format) {
  try {
    const res = await adminApi.exportReport(reportType.value, format, { date_from: dateFrom.value, date_to: dateTo.value })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `zaneco-report-${reportType.value}.${format}`
    link.click()
  } catch {}
}
</script>

<style scoped>
.page-header { margin-bottom: 1.5rem; }
.page-header h1 { font-size: var(--font-size-2xl); }
.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.card-title { font-size: var(--font-size-base); font-weight: 600; margin-bottom: 1rem; }
.report-table { width: 100%; border-collapse: collapse; }
.report-table th { text-align: left; padding: 0.625rem 0.75rem; font-size: var(--font-size-xs); font-weight: 600; color: var(--color-gray-500); border-bottom: 2px solid var(--color-gray-200); text-transform: capitalize; }
.report-table td { padding: 0.625rem 0.75rem; font-size: var(--font-size-sm); border-bottom: 1px solid var(--color-gray-100); }
</style>
