<template>
  <div>
    <!-- Header -->
    <header class="ap-header">
      <div class="ap-header-left">
        <div class="ap-search-box">
          <span class="material-symbols-outlined ap-search-icon">search</span>
          <input v-model="searchTerm" class="ap-search-input" placeholder="Search by Reference, Name, or Account #..." @input="onSearchInput" />
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
          <option value="rejected">Rejected</option>
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
          <span v-if="tab.count" class="status-tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Table -->
      <div class="ap-table-wrap">
        <div class="ap-table-scroll">
          <table class="ap-table">
            <thead>
              <tr>
                <th><div class="th-sort" @click="toggleSort('reference_number')">Ref Number <span class="material-symbols-outlined th-icon">{{ sortBy === 'reference_number' ? (sortOrder === 'asc' ? 'arrow_drop_up' : 'arrow_drop_down') : 'arrow_drop_down' }}</span></div></th>
                <th><div class="th-sort" @click="toggleSort('consumer_name')">Consumer Name <span class="material-symbols-outlined th-icon">{{ sortBy === 'consumer_name' ? (sortOrder === 'asc' ? 'arrow_drop_up' : 'arrow_drop_down') : 'unfold_more' }}</span></div></th>
                <th>Account Number</th>
                <th>Concern Type</th>
                <th><div class="th-sort" @click="toggleSort('appointment_date')">Date <span class="material-symbols-outlined th-icon">{{ sortBy === 'appointment_date' ? (sortOrder === 'asc' ? 'arrow_drop_up' : 'arrow_drop_down') : 'unfold_more' }}</span></div></th>
                <th>Time</th>
                <th><div class="th-sort" @click="toggleSort('status')">Status <span class="material-symbols-outlined th-icon">{{ sortBy === 'status' ? (sortOrder === 'asc' ? 'arrow_drop_up' : 'arrow_drop_down') : 'unfold_more' }}</span></div></th>
                <th class="th-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in appointments" :key="row.id" class="ap-row">
                <td class="td-ref">{{ row.reference_number }}</td>
                <td class="td-name">{{ row.consumer_name }}</td>
                <td class="td-muted">{{ row.account_number }}</td>
                <td><span class="td-type-badge">{{ row.concern_type }}</span></td>
                <td class="td-date">{{ row.appointment_date }}</td>
                <td class="td-date">{{ row.start_time?.slice(0,5) }}</td>
                <td><span class="badge" :class="'badge-' + row.status">{{ statusLabel(row.status) }}</span></td>
                <td class="td-actions">
                  <router-link :to="`/admin/appointments/${row.id}`" class="row-action" title="View"><span class="material-symbols-outlined">visibility</span></router-link>
                  <button v-if="['pending', 'rescheduled'].includes(row.status)" class="row-action" @click="quickAction(row.id, 'confirmed')" title="Confirm" style="color:#059669"><span class="material-symbols-outlined">check_circle</span></button>
                  <button v-if="row.status === 'confirmed'" class="row-action" @click="quickAction(row.id, 'completed')" title="Complete" style="color:#059669"><span class="material-symbols-outlined">task_alt</span></button>
                  <button v-if="['pending','confirmed','rescheduled'].includes(row.status)" class="row-action" @click="quickAction(row.id, 'cancelled')" title="Cancel" style="color:#dc2626"><span class="material-symbols-outlined">cancel</span></button>
                  <button v-if="row.status === 'pending'" class="row-action" @click="openReject(row)" title="Reject" style="color:#991b1b"><span class="material-symbols-outlined">block</span></button>
                  <button v-if="['pending','confirmed','rescheduled'].includes(row.status)" class="row-action" @click="openReschedule(row)" title="Reschedule" style="color:#0284c7"><span class="material-symbols-outlined">edit_calendar</span></button>
                  <button v-if="!['archived','cancelled','completed'].includes(row.status)" class="row-action" @click="quickAction(row.id, 'archived')" title="Archive" style="color:#6b7280"><span class="material-symbols-outlined">archive</span></button>
                  <button v-if="isSuperAdmin" class="row-action" @click="deleteRow(row)" title="Delete" style="color:#dc2626"><span class="material-symbols-outlined">delete</span></button>
                </td>
              </tr>
              <tr v-if="appointments.length === 0">
                <td colspan="8" class="td-empty">No appointments found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="ap-pagination">
          <div class="ap-pagination-left">
            <span class="pagination-info">Showing {{ (currentPage - 1) * perPage + 1 }} to {{ Math.min(currentPage * perPage, totalCount) }} of {{ totalCount }} results</span>
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

    <!-- Reschedule Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showRescheduleModal" class="resched-overlay" @click.self="showRescheduleModal = false">
          <div class="resched-modal">
            <div class="resched-header">
              <h3>Reschedule Appointment</h3>
              <button class="resched-close" @click="showRescheduleModal = false">&times;</button>
            </div>
            <div class="resched-body">
              <p class="resched-consumer"><strong>{{ reschedApt?.consumer_name }}</strong></p>
              <p class="resched-ref">{{ reschedApt?.reference_number }}</p>
              <div class="form-group">
                <label class="form-label">New Date</label>
                <input v-model="reschedDate" type="date" class="form-input" :min="minDate" />
              </div>
              <div class="form-group" style="margin-top:0.75rem">
                <label class="form-label">New Time</label>
                <div v-if="reschedSlotsLoading" class="text-sm text-muted">Loading available times...</div>
                <div v-else-if="reschedSlots.length === 0" class="text-sm text-muted">No available slots for this date</div>
                <div v-else class="resched-slot-grid">
                  <button v-for="slot in reschedSlots" :key="slot.start_time" type="button"
                    class="resched-slot-btn"
                    :class="{ 'rslot-active': reschedTime === slot.start_time, 'rslot-disabled': !slot.available }"
                    :disabled="!slot.available"
                    @click="reschedTime = slot.start_time"
                  >{{ slot.start_time?.slice(0, 5) }}</button>
                </div>
              </div>
              <div class="form-group" style="margin-top:0.75rem">
                <label class="form-label">Reason</label>
                <textarea v-model="reschedReason" class="form-input" rows="2" placeholder="Reason for rescheduling"></textarea>
              </div>
            </div>
            <div class="resched-footer">
              <button class="btn btn-secondary" @click="showRescheduleModal = false">Cancel</button>
              <button class="btn btn-primary" @click="confirmReschedule" :disabled="reschedSaving || !reschedDate || !reschedTime">
                {{ reschedSaving ? 'Rescheduling...' : 'Confirm Reschedule' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Reject Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showRejectModal" class="resched-overlay" @click.self="showRejectModal = false">
          <div class="resched-modal">
            <div class="resched-header">
              <h3>Reject Appointment</h3>
              <button class="resched-close" @click="showRejectModal = false">&times;</button>
            </div>
            <div class="resched-body">
              <p class="resched-consumer"><strong>{{ rejectApt?.consumer_name }}</strong></p>
              <p class="resched-ref">{{ rejectApt?.reference_number }}</p>
              <div class="form-group">
                <label class="form-label">Reason for Rejection</label>
                <textarea v-model="rejectReason" class="form-input" rows="3" placeholder="Why is this appointment being rejected?"></textarea>
              </div>
            </div>
            <div class="resched-footer">
              <button class="btn btn-secondary" @click="showRejectModal = false">Keep</button>
              <button class="btn btn-danger" @click="confirmReject" :disabled="rejectSaving">
                {{ rejectSaving ? 'Rejecting...' : 'Reject Appointment' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAppointmentsStore } from '../../stores/appointments'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { adminApi } from '../../api/admin'
import { consumerApi } from '../../api/consumer'
import { statusLabel } from '../../utils/formatters'
import { useToast } from '../../composables/useToast'
const auth = useAuthStore()
const toast = useToast()
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
const sortBy = ref('')
const sortOrder = ref('desc')

const statusTabs = computed(() => {
  return [
    { key: '', label: 'All', count: total.value || 0 },
    { key: 'pending', label: 'Pending', count: 0 },
    { key: 'confirmed', label: 'Confirmed', count: 0 },
    { key: 'rescheduled', label: 'Rescheduled', count: 0 },
    { key: 'completed', label: 'Completed', count: 0 },
    { key: 'cancelled', label: 'Cancelled', count: 0 },
    { key: 'rejected', label: 'Rejected', count: 0 },
    { key: 'no_show', label: 'No Show', count: 0 },
    { key: 'archived', label: 'Archived', count: 0 },
  ]
})

const totalCount = computed(() => total.value || 0)

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.setFilters({ search: searchTerm.value || '' })
    store.fetchAppointments(1, perPage.value)
  }, 300)
}

const pageRange = computed(() => {
  const l = lastPage.value || 1
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(l, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const showRescheduleModal = ref(false)
const reschedApt = ref(null)
const reschedDate = ref('')
const reschedTime = ref('')
const reschedReason = ref('')
const reschedSlots = ref([])
const reschedSlotsLoading = ref(false)
const reschedSaving = ref(false)
const showRejectModal = ref(false)
const rejectApt = ref(null)
const rejectReason = ref('')
const rejectSaving = ref(false)
const minDate = new Date().toISOString().split('T')[0]
const lastFetchedDate = ref('')

async function fetchReschedSlots(date) {
  if (!reschedApt.value) return
  reschedSlotsLoading.value = true
  try {
    const officeId = reschedApt.value.office_id || 1
    const { data } = await consumerApi.getTimeSlots(officeId, date)
    if (lastFetchedDate.value !== date) return
    reschedSlots.value = data.data?.slots || []
  } catch (err) {
    console.error('Failed to fetch reschedule slots:', err)
    reschedSlots.value = []
  } finally {
    reschedSlotsLoading.value = false
  }
}

watch(reschedDate, (val) => {
  reschedTime.value = ''
  lastFetchedDate.value = val
  if (val) fetchReschedSlots(val)
})

function openReschedule(apt) {
  reschedApt.value = apt
  reschedDate.value = ''
  reschedTime.value = ''
  reschedReason.value = ''
  reschedSlots.value = []
  showRescheduleModal.value = true
}

async function confirmReschedule() {
  if (!reschedApt.value || !reschedDate.value || !reschedTime.value) return
  reschedSaving.value = true
  try {
    await adminApi.rescheduleAppointment(reschedApt.value.id, {
      new_appointment_date: reschedDate.value,
      new_start_time: reschedTime.value,
      notes: reschedReason.value,
    })
    showRescheduleModal.value = false
    await store.fetchAppointments(currentPage.value, perPage.value)
  } catch (err) {
    toast.error('Reschedule failed: ' + (err.response?.data?.error?.message || err.message))
  } finally {
    reschedSaving.value = false
  }
}

async function deleteRow(row) {
  if (!confirm(`⚠️ Permanently delete appointment ${row.reference_number}? This is for testing only.`)) return
  try {
    await adminApi.deleteAppointment(row.id)
    await store.fetchAppointments(currentPage.value, perPage.value)
  } catch (err) {
    toast.error('Delete failed: ' + (err.response?.data?.error?.message || 'Permission denied'))
  }
}

function openReject(apt) {
  rejectApt.value = apt
  rejectReason.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!rejectApt.value) return
  rejectSaving.value = true
  try {
    await adminApi.updateAppointmentStatus(rejectApt.value.id, { status: 'rejected', notes: rejectReason.value })
    showRejectModal.value = false
    await store.fetchAppointments(currentPage.value, perPage.value)
  } catch (err) {
    toast.error('Reject failed: ' + (err.response?.data?.error?.message || err.message))
  } finally {
    rejectSaving.value = false
  }
}

async function quickAction(id, status) {
  if (status === 'cancelled' && !confirm('Cancel this appointment?')) return
  try {
    await adminApi.updateAppointmentStatus(id, { status })
    await store.fetchAppointments(currentPage.value, perPage.value)
  } catch (err) { console.error('Quick action failed:', err); toast.error('Action failed. Please try again.') }
}

function changePage(p) {
  store.fetchAppointments(p, perPage.value)
}
function setTab(key) {
  activeTab.value = key
  filterStatus.value = key || ''
  store.setFilters({ status: key || '', search: searchTerm.value || '' })
  store.fetchAppointments(1, perPage.value)
}

function applyFilters() {
  store.setFilters({
    status: filterStatus.value || '',
    date_from: filterDateFrom.value || '',
    date_to: filterDateTo.value || '',
    search: searchTerm.value || '',
    sort_by: sortBy.value || '',
    sort_order: sortOrder.value || '',
  })
  store.fetchAppointments(1, perPage.value)
}

function clearFilters() {
  filterStatus.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
  activeTab.value = ''
  searchTerm.value = ''
  sortBy.value = ''
  sortOrder.value = 'desc'
  store.clearFilters()
  store.fetchAppointments(1, perPage.value)
}

function toggleSort(column) {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
  store.setFilters({
    status: filterStatus.value || '',
    date_from: filterDateFrom.value || '',
    date_to: filterDateTo.value || '',
    search: searchTerm.value || '',
    sort_by: sortBy.value,
    sort_order: sortOrder.value,
  })
  store.fetchAppointments(1, perPage.value)
}

async function exportCSV() {
  try {
    const params = {}
    if (filterStatus.value) params.date_from = filterDateFrom.value || ''
    if (filterDateTo.value) params.date_to = filterDateTo.value || ''
    const response = await adminApi.exportReport('appointments-by-office', 'csv', params)
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `zaneco-appointments-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Export failed:', err)
    toast.error('Export failed. Please try again.')
  }
}

onMounted(() => store.fetchAppointments(1, perPage.value))
</script>

<style scoped>
/* Header */
.ap-header {
  position: sticky; top: 0; z-index: 20;
  background-color: var(--color-primary-light);
  border-bottom: 1px solid rgba(229,231,235,0.3);
  padding: 0.75rem 1.5rem;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}
.ap-header-left { display: flex; align-items: center; gap: 0.75rem; flex: 1; max-width: 900px; }
.ap-header-right { display: flex; align-items: center; gap: 0.5rem; }
@media (max-width: 768px) { .ap-header-right { display: none; } }

.menu-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: none; border-radius: 50%; color: var(--color-gray-900); cursor: pointer; margin-left: -0.5rem; }
.menu-btn:hover { background-color: var(--color-primary-muted); }
@media (min-width: 1024px) { .menu-btn { display: none; } }

.ap-search-box { position: relative; flex: 1; }
.ap-search-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: var(--color-gray-400); font-size: 1.25rem; pointer-events: none; }
.ap-search-input {
  width: 100%; padding: 0.625rem 0.75rem 0.625rem 2.75rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background-color: var(--color-primary-muted);
  font-size: 1rem; outline: none; transition: all 0.15s;
}
.ap-search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(217,119,6,0.15); }

.ap-filter-btn {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 1rem; border-radius: var(--radius-xl);
  background-color: var(--color-primary-muted); border: 1px solid var(--color-border);
  color: var(--color-gray-900); font-size: 0.875rem; font-weight: 600;
  cursor: pointer; white-space: nowrap;
}
.ap-filter-btn:hover { background-color: #fde68a; }
.ap-new-btn {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 1rem; border-radius: var(--radius-xl);
  background-color: var(--color-primary); border: none;
  color: var(--color-white); font-size: 0.875rem; font-weight: 600;
  cursor: pointer; white-space: nowrap;
}
.ap-new-btn:hover { filter: brightness(1.1); }

.ap-icon-btn { position: relative; padding: 0.5rem; border: none; background: none; border-radius: 50%; color: var(--color-gray-600); cursor: pointer; }
.ap-icon-btn:hover { background-color: var(--color-primary-muted); }
/* Filter Panel */
.filter-panel { display: flex; gap: 1rem; padding: 0.75rem 1.5rem; background-color: var(--color-primary-muted); border-bottom: 1px solid var(--color-border); flex-wrap: wrap; align-items: flex-end; }
.filter-group { display: flex; flex-direction: column; gap: 0.25rem; min-width: 150px; }
.filter-label { font-size: 0.6875rem; font-weight: 600; color: var(--color-gray-600); text-transform: uppercase; letter-spacing: 0.05em; }
.filter-select { padding: 0.375rem 0.625rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.8125rem; background: var(--color-white); outline: none; }
.filter-select:focus { border-color: var(--color-primary); }
.filter-clear { padding: 0.375rem 0.875rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-white); font-size: 0.8125rem; font-weight: 600; color: var(--color-gray-600); cursor: pointer; }
.filter-clear:hover { background-color: var(--color-primary-muted); }

/* Content */
.ap-content { padding: 1.5rem; }

/* Title Row */
.ap-title-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; }
.ap-title { font-size: 1.75rem; font-weight: 700; color: var(--color-gray-900); }
.ap-subtitle { font-size: 0.875rem; color: var(--color-gray-600); margin-top: 0.25rem; }
.ap-title-actions { display: flex; align-items: center; gap: 0.5rem; }
.ap-view-toggle { display: flex; background-color: var(--color-primary-muted); padding: 0.25rem; border-radius: var(--radius-lg); border: 1px solid var(--color-border); }
.toggle-btn { padding: 0.375rem 0.75rem; border: none; background: none; border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 600; color: var(--color-gray-600); cursor: pointer; }
.toggle-active { background-color: var(--color-primary-muted); color: var(--color-gray-900); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.ap-export-btn { padding: 0.5rem; border: 1px solid var(--color-border); background: none; border-radius: var(--radius-xl); color: var(--color-gray-600); cursor: pointer; }
.ap-export-btn:hover { background-color: var(--color-primary-muted); }

/* Table */
.ap-table-wrap { background-color: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.ap-table-scroll { overflow-x: auto; }
.ap-table { width: 100%; min-width: 1000px; border-collapse: separate; border-spacing: 0; }
.ap-table th {
  padding: 0.875rem 1.25rem;
  background-color: var(--color-bg);
  border-bottom: 2px solid var(--color-primary);
  font-size: 0.75rem; font-weight: 600; color: var(--color-gray-700);
  text-transform: uppercase; letter-spacing: 0.05em;
  text-align: left; position: sticky; top: 0;
}
.th-right { text-align: right; }
.th-sort { display: flex; align-items: center; cursor: pointer; }
.th-icon { font-size: 1.125rem; color: var(--color-gray-400); margin-left: 0.25rem; }

.ap-table td { padding: 0.875rem 1.25rem; font-size: 0.875rem; border-bottom: 1px solid var(--color-gray-100); color: var(--color-text); }
.ap-row:hover td { background-color: var(--color-primary-light); }
.ap-row:nth-child(even) td { background-color: var(--color-gray-50); }
.ap-row:nth-child(even):hover td { background-color: var(--color-primary-light); }
.td-ref { font-weight: 700; color: var(--color-primary); font-size: 0.8125rem; }
.td-name { font-weight: 600; color: var(--color-text); }
.td-muted { color: var(--color-text-muted); }
.td-type-badge { display: inline-block; padding: 0.25rem 0.625rem; background-color: var(--color-primary-muted); border-radius: 4px; font-size: 0.75rem; font-weight: 500; color: var(--color-gray-600); }
.td-date { color: var(--color-text); }
.td-empty { text-align: center; color: var(--color-gray-400); padding: 2rem; }
.td-actions { text-align: right; white-space: nowrap; }
.row-action { padding: 0.375rem; border: none; background: none; border-radius: 50%; color: var(--color-gray-600); cursor: pointer; vertical-align: middle; }
.row-action:hover { background-color: #fde68a; }
.row-action .material-symbols-outlined { font-size: 1.25rem; }

/* Pagination */
.ap-pagination {
  padding: 0.75rem 1.25rem;
  background-color: var(--color-primary-muted);
  border-top: 1px solid var(--color-border);
  display: flex; flex-direction: column; gap: 0.75rem;
  align-items: center;
}
@media (min-width: 640px) { .ap-pagination { flex-direction: row; justify-content: space-between; } }
.ap-pagination-left { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.pagination-info { font-size: 0.75rem; color: var(--color-gray-600); }
.pagination-select { background: var(--color-primary-muted); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: 0.75rem; padding: 0.25rem 0.5rem; outline: none; }
.ap-pagination-right { display: flex; align-items: center; gap: 0.25rem; }
.page-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid var(--color-border); background: none; border-radius: var(--radius-lg); color: var(--color-gray-600); cursor: pointer; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:hover:not(:disabled) { background-color: var(--color-primary-muted); }
.page-btn .material-symbols-outlined { font-size: 1rem; }
.page-numbers { display: flex; gap: 0.25rem; padding: 0 0.5rem; }
.page-num { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: none; border-radius: var(--radius-lg); font-size: 0.875rem; font-weight: 600; color: var(--color-gray-600); cursor: pointer; }
.page-num:hover { background-color: var(--color-primary-muted); }
.page-num-active { background-color: var(--color-primary) !important; color: var(--color-white) !important; }



/* Status Tabs */
.status-tabs { display: flex; gap: 0.375rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
.status-tab { display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border: 1px solid var(--color-border); border-radius: 9999px; background: var(--color-white); font-size: 0.8125rem; font-weight: 600; color: var(--color-gray-600); cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.status-tab:hover { background-color: var(--color-primary-muted); }
.status-tab-active { background-color: var(--color-primary) !important; color: var(--color-white) !important; border-color: var(--color-primary) !important; }
.status-tab-count { font-size: 0.6875rem; background: rgba(0,0,0,0.08); padding: 0.0625rem 0.375rem; border-radius: 9999px; font-weight: 700; }
.status-tab-active .status-tab-count { background: rgba(255,255,255,0.2); }

/* Reschedule Modal */
.resched-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 1rem;
}
.resched-modal {
  background: var(--color-white); border-radius: var(--radius-xl);
  width: 100%; max-width: 480px; box-shadow: var(--shadow-xl);
}
.resched-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border);
}
.resched-header h3 { font-size: 1.125rem; font-weight: 700; }
.resched-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-gray-500); padding: 0; line-height: 1; }
.resched-body { padding: 1.25rem 1.5rem; }
.resched-consumer { font-size: var(--font-size-lg); margin-bottom: 0.25rem; }
.resched-ref { font-size: var(--font-size-sm); color: var(--color-gray-500); font-family: monospace; margin-bottom: 1rem; }
.resched-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--color-border); }
.resched-slot-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.375rem; margin-top: 0.25rem; }
.resched-slot-btn {
  padding: 0.5rem 0.25rem; border: 1px solid var(--color-border);
  background: var(--color-white); border-radius: var(--radius-md);
  font-size: var(--font-size-sm); font-weight: 600; color: var(--color-gray-700);
  cursor: pointer; transition: all 0.15s;
}
.resched-slot-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.resched-slot-btn.rslot-active { border-color: var(--color-primary); background-color: var(--color-primary); color: var(--color-white); }
.resched-slot-btn.rslot-disabled { opacity: 0.35; cursor: not-allowed; }
.resched-slot-btn.rslot-disabled:hover { border-color: var(--color-border); color: var(--color-gray-700); }
.modal-enter-active { transition: opacity 0.2s ease; }
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .resched-modal { animation: modalSlideIn 0.25s cubic-bezier(0.4,0,0.2,1) both; }
.modal-leave-active .resched-modal { animation: modalSlideIn 0.2s cubic-bezier(0.4,0,0.2,1) reverse both; }
@keyframes modalSlideIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>
