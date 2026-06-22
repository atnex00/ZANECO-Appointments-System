<template>
  <div>
    <!-- Header -->
    <header class="ap-header">
      <div class="ap-header-left">
        <button class="menu-btn" @click="toggleDrawer(true)">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="ap-search-box">
          <span class="material-symbols-outlined ap-search-icon">search</span>
          <input v-model="searchTerm" class="ap-search-input" placeholder="Search by Reference, Name, or Account #..." />
        </div>
        <button class="ap-filter-btn" @click="showFilters = !showFilters">
          <span class="material-symbols-outlined">filter_list</span> Filters
        </button>
        <router-link to="/book" class="ap-new-btn" target="_blank">
          <span class="material-symbols-outlined">add</span> New Appointment
        </router-link>
      </div>
      <div class="ap-header-right">
        <router-link to="/admin/notifications" class="ap-icon-btn">
          <span class="material-symbols-outlined">notifications</span>
        </router-link>
        <button class="ap-icon-btn" title="Help">
          <span class="material-symbols-outlined">help</span>
        </button>
      </div>
    </header>

    <!-- Filter Panel -->
    <div v-if="showFilters" class="filter-panel">
      <div class="filter-group">
        <label class="filter-label">Status</label>
        <select v-model="filterStatus" class="filter-select" @change="applyFilters">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Date From</label>
        <input v-model="filterDateFrom" type="date" class="filter-select" @change="applyFilters" />
      </div>
      <div class="filter-group">
        <label class="filter-label">Date To</label>
        <input v-model="filterDateTo" type="date" class="filter-select" @change="applyFilters" />
      </div>
      <div class="filter-group" style="align-self:flex-end">
        <button class="filter-clear" @click="clearFilters">Clear</button>
      </div>
    </div>

    <div class="ap-content">
      <!-- Title Row -->
      <div class="ap-title-row">
        <div>
          <h2 class="ap-title">Appointment Records</h2>
          <p class="ap-subtitle">Manage and track service requests across all regions.</p>
        </div>
        <div class="ap-title-actions">
          <div class="ap-view-toggle">
            <button class="toggle-btn" :class="{ 'toggle-active': viewMode === 'table' }" @click="viewMode = 'table'">Table</button>
            <router-link to="/admin/calendar" class="toggle-btn" :class="{ 'toggle-active': viewMode === 'calendar' }">Calendar</router-link>
          </div>
          <button class="ap-export-btn" @click="exportCSV" title="Export as CSV">
            <span class="material-symbols-outlined">download</span>
          </button>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="status-tabs">
        <button v-for="tab in statusTabs" :key="tab.key" class="status-tab" :class="{ 'status-tab-active': activeTab === tab.key }" @click="setTab(tab.key)">
          {{ tab.label }}
          <span class="status-tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Table -->
      <div class="ap-table-wrap">
        <div class="ap-table-scroll">
          <table class="ap-table">
            <thead>
              <tr>
                <th><div class="th-sort">Ref Number <span class="material-symbols-outlined th-icon">arrow_drop_down</span></div></th>
                <th><div class="th-sort">Consumer Name <span class="material-symbols-outlined th-icon">unfold_more</span></div></th>
                <th>Account Number</th>
                <th>Concern Type</th>
                <th><div class="th-sort">Date <span class="material-symbols-outlined th-icon">unfold_more</span></div></th>
                <th>Time</th>
                <th>Status</th>
                <th class="th-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.id" class="ap-row">
                <td class="td-ref">{{ row.reference_number }}</td>
                <td class="td-name">{{ row.consumer_name }}</td>
                <td class="td-muted">{{ row.account_number }}</td>
                <td><span class="td-type-badge">{{ row.concern_type }}</span></td>
                <td class="td-date">{{ row.appointment_date }}</td>
                <td class="td-date">{{ row.start_time?.slice(0,5) }}</td>
                <td><span class="status-badge" :class="'status-' + row.status">{{ statusLabel(row.status) }}</span></td>
                <td class="td-actions">
                  <router-link :to="`/admin/appointments/${row.id}`" class="row-action" title="View"><span class="material-symbols-outlined">visibility</span></router-link>
                  <button v-if="row.status === 'pending'" class="row-action" @click="quickAction(row.id, 'confirmed')" title="Confirm" style="color:#059669"><span class="material-symbols-outlined">check_circle</span></button>
                  <button v-if="row.status === 'confirmed'" class="row-action" @click="quickAction(row.id, 'completed')" title="Complete" style="color:#059669"><span class="material-symbols-outlined">task_alt</span></button>
                  <button v-if="['pending','confirmed','rescheduled'].includes(row.status)" class="row-action" @click="quickAction(row.id, 'cancelled')" title="Cancel" style="color:#dc2626"><span class="material-symbols-outlined">cancel</span></button>
                  <button v-if="!['archived','cancelled','completed'].includes(row.status)" class="row-action" @click="quickAction(row.id, 'archived')" title="Archive" style="color:#6b7280"><span class="material-symbols-outlined">archive</span></button>
                  <button v-if="isSuperAdmin" class="row-action" @click="deleteRow(row)" title="Delete" style="color:#dc2626"><span class="material-symbols-outlined">delete</span></button>
                </td>
              </tr>
              <tr v-if="filteredRows.length === 0">
                <td colspan="8" class="td-empty">No appointments found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="ap-pagination">
          <div class="ap-pagination-left">
            <span class="pagination-info">Showing 1 to {{ filteredRows.length }} of {{ totalCount }} results</span>
            <select v-model="perPage" class="pagination-select">
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
          <div class="ap-pagination-right">
            <button class="page-btn" :disabled="currentPage <= 1" @click="changePage(1)"><span class="material-symbols-outlined">first_page</span></button>
            <button class="page-btn" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)"><span class="material-symbols-outlined">chevron_left</span></button>
            <div class="page-numbers">
              <button v-for="p in pageRange" :key="p" class="page-num" :class="{ 'page-num-active': p === currentPage }" @click="changePage(p)">{{ p }}</button>
            </div>
            <button class="page-btn" :disabled="currentPage >= lastPage" @click="changePage(currentPage + 1)"><span class="material-symbols-outlined">chevron_right</span></button>
            <button class="page-btn" :disabled="currentPage >= lastPage" @click="changePage(lastPage)"><span class="material-symbols-outlined">last_page</span></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppointmentsStore } from '../../stores/appointments'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { adminApi } from '../../api/admin'
import { statusLabel } from '../../utils/formatters'

const toggleDrawer = inject('toggleDrawer', () => {})

const router = useRouter()
const auth = useAuthStore()
const isSuperAdmin = computed(() => auth.user?.role === 'super_admin')
const store = useAppointmentsStore()
const { list: appointments, total, currentPage, lastPage } = storeToRefs(store)
const searchTerm = ref('')
const perPage = ref(10)
const activeTab = ref('')
const showFilters = ref(false)
const viewMode = ref('table')
const filterStatus = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')

const statusTabs = computed(() => {
  const counts = { '': total.value || 0 }
  for (const a of appointments.value) {
    counts[a.status] = (counts[a.status] || 0) + 1
  }
  return [
    { key: '', label: 'All', count: counts[''] },
    { key: 'pending', label: 'Pending', count: counts['pending'] || 0 },
    { key: 'confirmed', label: 'Confirmed', count: counts['confirmed'] || 0 },
    { key: 'rescheduled', label: 'Rescheduled', count: counts['rescheduled'] || 0 },
    { key: 'completed', label: 'Completed', count: counts['completed'] || 0 },
    { key: 'cancelled', label: 'Cancelled', count: counts['cancelled'] || 0 },
    { key: 'no_show', label: 'No Show', count: counts['no_show'] || 0 },
    { key: 'archived', label: 'Archived', count: counts['archived'] || 0 },
  ]
})

const totalCount = computed(() => total.value || 0)

const filteredRows = computed(() => {
  let rows = appointments.value
  if (activeTab.value) {
    rows = rows.filter(a => a.status === activeTab.value)
  }
  if (searchTerm.value.trim()) {
    const q = searchTerm.value.toLowerCase()
    rows = rows.filter(a =>
      (a.reference_number && a.reference_number.toLowerCase().includes(q)) ||
      (a.consumer_name && a.consumer_name.toLowerCase().includes(q)) ||
      (a.account_number && a.account_number.toLowerCase().includes(q))
    )
  }
  return rows
})

const pageRange = computed(() => {
  const l = lastPage.value || 1
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(l, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

async function deleteRow(row) {
  if (!confirm(`⚠️ Permanently delete appointment ${row.reference_number}? This is for testing only.`)) return
  try {
    await adminApi.deleteAppointment(row.id)
    await store.fetchAppointments(currentPage.value)
  } catch (err) {
    alert('Delete failed: ' + (err.response?.data?.error?.message || 'Permission denied'))
  }
}

async function quickAction(id, status) {
  if (status === 'cancelled' && !confirm('Cancel this appointment?')) return
  try {
    await adminApi.updateAppointmentStatus(id, { status })
    await store.fetchAppointments(currentPage.value)
  } catch {}
}

function changePage(p) { store.fetchAppointments(p) }
function setTab(key) {
  activeTab.value = key
  store.setFilters({ status: key || '' })
  store.fetchAppointments(1)
}

function applyFilters() {
  store.setFilters({ status: filterStatus.value || '', date_from: filterDateFrom.value || '', date_to: filterDateTo.value || '' })
  store.fetchAppointments(1)
}

function clearFilters() {
  filterStatus.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
  activeTab.value = ''
  store.clearFilters()
  store.fetchAppointments(1)
}

function exportCSV() {
  const headers = ['Reference Number', 'Consumer Name', 'Account Number', 'Concern Type', 'Office', 'Date', 'Time', 'Status']
  const rows = filteredRows.value.map(a => [
    a.reference_number, a.consumer_name, a.account_number, a.concern_type, a.office, a.appointment_date, a.start_time?.slice(0,5), a.status
  ])
  const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `zaneco-appointments-${new Date().toISOString().slice(0,10)}.csv`
  link.click()
}

onMounted(() => store.fetchAppointments(1))
</script>

<style scoped>
/* Header */
.ap-header {
  position: sticky; top: 0; z-index: 20;
  background-color: #f8f9ff;
  border-bottom: 1px solid rgba(196,197,213,0.3);
  padding: 0.75rem 1.5rem;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}
.ap-header-left { display: flex; align-items: center; gap: 0.75rem; flex: 1; max-width: 900px; }
.ap-header-right { display: flex; align-items: center; gap: 0.5rem; }
@media (max-width: 768px) { .ap-header-right { display: none; } }

.menu-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: none; border-radius: 50%; color: #121c28; cursor: pointer; margin-left: -0.5rem; }
.menu-btn:hover { background-color: #dfe9fa; }
@media (min-width: 1024px) { .menu-btn { display: none; } }

.ap-search-box { position: relative; flex: 1; }
.ap-search-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: #757684; font-size: 1.25rem; pointer-events: none; }
.ap-search-input {
  width: 100%; padding: 0.625rem 0.75rem 0.625rem 2.75rem;
  border-radius: var(--radius-xl);
  border: 1px solid #c4c5d5;
  background-color: #eef4ff;
  font-size: 1rem; outline: none; transition: all 0.15s;
}
.ap-search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(217,119,6,0.15); }

.ap-filter-btn {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 1rem; border-radius: var(--radius-xl);
  background-color: #dfe9fa; border: 1px solid #c4c5d5;
  color: #121c28; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; white-space: nowrap;
}
.ap-filter-btn:hover { background-color: #d9e3f4; }
.ap-new-btn {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 1rem; border-radius: var(--radius-xl);
  background-color: var(--color-primary); border: none;
  color: var(--color-white); font-size: 0.875rem; font-weight: 600;
  cursor: pointer; white-space: nowrap;
}
.ap-new-btn:hover { filter: brightness(1.1); }

.ap-icon-btn { position: relative; padding: 0.5rem; border: none; background: none; border-radius: 50%; color: #444653; cursor: pointer; }
.ap-icon-btn:hover { background-color: #dfe9fa; }
/* Filter Panel */
.filter-panel { display: flex; gap: 1rem; padding: 0.75rem 1.5rem; background-color: #eef4ff; border-bottom: 1px solid #c4c5d5; flex-wrap: wrap; align-items: flex-end; }
.filter-group { display: flex; flex-direction: column; gap: 0.25rem; min-width: 150px; }
.filter-label { font-size: 0.6875rem; font-weight: 600; color: #444653; text-transform: uppercase; letter-spacing: 0.05em; }
.filter-select { padding: 0.375rem 0.625rem; border: 1px solid #c4c5d5; border-radius: var(--radius-md); font-size: 0.8125rem; background: var(--color-white); outline: none; }
.filter-select:focus { border-color: var(--color-primary); }
.filter-clear { padding: 0.375rem 0.875rem; border: 1px solid #c4c5d5; border-radius: var(--radius-md); background: var(--color-white); font-size: 0.8125rem; font-weight: 600; color: #444653; cursor: pointer; }
.filter-clear:hover { background-color: #dfe9fa; }

/* Content */
.ap-content { padding: 1.5rem; }

/* Title Row */
.ap-title-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; }
.ap-title { font-size: 1.75rem; font-weight: 700; color: #121c28; }
.ap-subtitle { font-size: 0.875rem; color: #444653; margin-top: 0.25rem; }
.ap-title-actions { display: flex; align-items: center; gap: 0.5rem; }
.ap-view-toggle { display: flex; background-color: #eef4ff; padding: 0.25rem; border-radius: var(--radius-lg); border: 1px solid #c4c5d5; }
.toggle-btn { padding: 0.375rem 0.75rem; border: none; background: none; border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 600; color: #444653; cursor: pointer; }
.toggle-active { background-color: #dfe9fa; color: #121c28; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.ap-export-btn { padding: 0.5rem; border: 1px solid #c4c5d5; background: none; border-radius: var(--radius-xl); color: #444653; cursor: pointer; }
.ap-export-btn:hover { background-color: #dfe9fa; }

/* Table */
.ap-table-wrap { background-color: var(--color-white); border: 1px solid #c4c5d5; border-radius: var(--radius-xl); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.ap-table-scroll { overflow-x: auto; }
.ap-table { width: 100%; min-width: 1000px; border-collapse: collapse; }
.ap-table th {
  padding: 1rem 1.25rem;
  background-color: #eef4ff;
  border-bottom: 1px solid #c4c5d5;
  font-size: 0.75rem; font-weight: 600; color: #444653;
  text-transform: uppercase; letter-spacing: 0.05em;
  text-align: left;
}
.th-right { text-align: right; }
.th-sort { display: flex; align-items: center; cursor: pointer; }
.th-icon { font-size: 1.125rem; color: #757684; margin-left: 0.25rem; }

.ap-table td { padding: 1rem 1.25rem; font-size: 0.875rem; border-bottom: 1px solid rgba(196,197,213,0.3); }
.ap-row:hover td { background-color: #eef4ff; }
.td-ref { font-weight: 700; color: var(--color-primary); font-size: 0.8125rem; }
.td-name { font-weight: 600; color: #121c28; }
.td-muted { color: #444653; }
.td-type-badge { display: inline-block; padding: 0.25rem 0.625rem; background-color: #dfe9fa; border-radius: 4px; font-size: 0.75rem; font-weight: 500; color: #444653; }
.td-date { color: #121c28; }
.td-empty { text-align: center; color: #757684; padding: 2rem; }
.td-actions { text-align: right; white-space: nowrap; }
.row-action { padding: 0.375rem; border: none; background: none; border-radius: 50%; color: #444653; cursor: pointer; vertical-align: middle; }
.row-action:hover { background-color: #d9e3f4; }
.row-action .material-symbols-outlined { font-size: 1.25rem; }

/* Pagination */
.ap-pagination {
  padding: 0.75rem 1.25rem;
  background-color: #eef4ff;
  border-top: 1px solid #c4c5d5;
  display: flex; flex-direction: column; gap: 0.75rem;
  align-items: center;
}
@media (min-width: 640px) { .ap-pagination { flex-direction: row; justify-content: space-between; } }
.ap-pagination-left { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.pagination-info { font-size: 0.75rem; color: #444653; }
.pagination-select { background: #eef4ff; border: 1px solid #c4c5d5; border-radius: var(--radius-lg); font-size: 0.75rem; padding: 0.25rem 0.5rem; outline: none; }
.ap-pagination-right { display: flex; align-items: center; gap: 0.25rem; }
.page-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid #c4c5d5; background: none; border-radius: var(--radius-lg); color: #444653; cursor: pointer; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:hover:not(:disabled) { background-color: #dfe9fa; }
.page-btn .material-symbols-outlined { font-size: 1rem; }
.page-numbers { display: flex; gap: 0.25rem; padding: 0 0.5rem; }
.page-num { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: none; border-radius: var(--radius-lg); font-size: 0.875rem; font-weight: 600; color: #444653; cursor: pointer; }
.page-num:hover { background-color: #dfe9fa; }
.page-num-active { background-color: var(--color-primary) !important; color: var(--color-white) !important; }

/* Status Badges */
.status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; }
.status-pending { background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.status-confirmed { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.status-rescheduled { background-color: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
.status-cancelled { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.status-completed { background-color: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db; }
.status-no_show { background-color: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.status-archived { background-color: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }

/* Status Tabs */
.status-tabs { display: flex; gap: 0.375rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
.status-tab { display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border: 1px solid #c4c5d5; border-radius: 9999px; background: var(--color-white); font-size: 0.8125rem; font-weight: 600; color: #444653; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.status-tab:hover { background-color: #dfe9fa; }
.status-tab-active { background-color: var(--color-primary) !important; color: var(--color-white) !important; border-color: var(--color-primary) !important; }
.status-tab-count { font-size: 0.6875rem; background: rgba(0,0,0,0.08); padding: 0.0625rem 0.375rem; border-radius: 9999px; font-weight: 700; }
.status-tab-active .status-tab-count { background: rgba(255,255,255,0.2); }
</style>
