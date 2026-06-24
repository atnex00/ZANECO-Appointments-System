<template>
  <div>
    <div class="page-header"><h1>Audit Logs</h1></div>
    <div class="card mb-4">
      <div class="filter-row">
        <div class="form-group"><label class="form-label">Action</label>
          <select v-model="filters.action" class="form-select" @change="fetchLogs">
            <option value="">All Actions</option>
            <option value="APPOINTMENT_CREATED">Created</option>
            <option value="APPOINTMENT_CONFIRMED">Confirmed</option>
            <option value="APPOINTMENT_CANCELLED">Cancelled</option>
            <option value="APPOINTMENT_COMPLETED">Completed</option>
            <option value="APPOINTMENT_RESCHEDULED">Rescheduled</option>
            <option value="APPOINTMENT_NO_SHOW">No Show</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Date From</label><input v-model="filters.date_from" type="date" class="form-input" @change="fetchLogs" /></div>
        <div class="form-group"><label class="form-label">Date To</label><input v-model="filters.date_to" type="date" class="form-input" @change="fetchLogs" /></div>
        <div class="form-group" style="align-self:flex-end"><button class="btn btn-secondary btn-sm" @click="clearFilters">Clear</button></div>
      </div>
    </div>
    <LoadingSpinner :visible="loading" />
    <div v-if="!loading" class="card">
      <table class="audit-table">
        <thead><tr><th>Timestamp</th><th>Admin</th><th>Action</th><th>Entity</th><th>ID</th><th>IP Address</th></tr></thead>
        <tbody>
          <tr v-for="log in logs" :key="log.created_at + log.action">
            <td class="text-sm">{{ log.created_at }}</td>
            <td>{{ log.admin_name || 'Consumer' }}</td>
            <td><span class="audit-action-badge">{{ log.action }}</span></td>
            <td class="text-sm">{{ log.entity_type }}</td>
            <td class="text-sm">{{ log.entity_id }}</td>
            <td class="text-sm text-muted">{{ log.ip_address || 'N/A' }}</td>
          </tr>
          <tr v-if="logs.length === 0"><td colspan="6" class="text-center text-muted">No audit logs found.</td></tr>
        </tbody>
      </table>
      <div v-if="lastPage > 1" class="pagination">
        <button class="btn btn-sm btn-secondary" :disabled="page <= 1" @click="changePage(page - 1)">Previous</button>
        <span class="page-info">Page {{ page }} of {{ lastPage }}</span>
        <button class="btn btn-sm btn-secondary" :disabled="page >= lastPage" @click="changePage(page + 1)">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '../../api/admin'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const logs = ref([])
const loading = ref(true)
const page = ref(1)
const lastPage = ref(1)
const filters = reactive({ action: '', date_from: '', date_to: '' })

async function fetchLogs(p = 1) {
  loading.value = true; page.value = p
  try {
    const params = { page: p, ...filters }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const { data } = await adminApi.getAuditLogs(params)
    logs.value = data.data?.audit_logs || data.data || []
    lastPage.value = data.data?.pagination?.last_page || 1
  } catch (err) { console.error('Fetch audit logs failed:', err) } finally { loading.value = false }
}

function changePage(p) { fetchLogs(p) }
function clearFilters() { filters.action = ''; filters.date_from = ''; filters.date_to = ''; fetchLogs() }

onMounted(() => fetchLogs())
</script>

<style scoped>
.page-header { margin-bottom: 1.5rem; }
.page-header h1 { font-size: var(--font-size-2xl); }
.filter-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
.audit-table { width: 100%; border-collapse: collapse; }
.audit-table th { text-align: left; padding: 0.625rem 0.75rem; font-size: var(--font-size-xs); font-weight: 600; color: var(--color-gray-500); border-bottom: 2px solid var(--color-gray-200); }
.audit-table td { padding: 0.5rem 0.75rem; font-size: var(--font-size-sm); border-bottom: 1px solid var(--color-gray-100); }
.audit-table tr:hover td { background-color: var(--color-gray-50); }
.audit-action-badge { font-size: var(--font-size-xs); font-weight: 600; font-family: monospace; background-color: var(--color-gray-100); padding: 0.125rem 0.5rem; border-radius: var(--radius-sm); }
.pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding-top: 1rem; }
.page-info { font-size: var(--font-size-sm); color: var(--color-gray-500); }
</style>
