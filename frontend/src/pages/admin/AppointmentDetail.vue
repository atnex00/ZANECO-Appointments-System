<template>
  <div>
    <header class="ap-header">
      <div class="ap-header-left">
        <router-link to="/admin/appointments" class="back-link"><span class="material-symbols-outlined">arrow_back</span> Appointments</router-link>
        <h2 class="header-title" v-if="detail">#{{ detail.reference_number }}</h2>
      </div>
    </header>

    <div class="ap-content">
      <LoadingSpinner :visible="loading" />
      <template v-if="!loading && detail">

        <!-- Info Cards Row -->
        <div class="detail-cards-row">
          <div class="detail-card">
            <div class="detail-card-header"><span class="material-symbols-outlined">person</span> Consumer Info</div>
            <div class="detail-card-body">
              <div class="d-row"><span class="d-label">Name</span><span class="d-value">{{ detail.consumer_name }}</span></div>
              <div class="d-row"><span class="d-label">Account</span><span class="d-value">{{ detail.account_name }} / {{ detail.account_number }}</span></div>
              <div class="d-row"><span class="d-label">Mobile</span><span class="d-value">{{ detail.mobile_number }}</span></div>
              <div class="d-row"><span class="d-label">Email</span><span class="d-value">{{ detail.email || '—' }}</span></div>
            </div>
          </div>
          <div class="detail-card">
            <div class="detail-card-header"><span class="material-symbols-outlined">event</span> Appointment</div>
            <div class="detail-card-body">
              <div class="d-row"><span class="d-label">Office</span><span class="d-value">{{ detail.office }}</span></div>
              <div class="d-row"><span class="d-label">Concern</span><span class="d-value">{{ detail.concern_type }}</span></div>
              <div class="d-row"><span class="d-label">Date</span><span class="d-value">{{ detail.appointment_date }}</span></div>
              <div class="d-row"><span class="d-label">Time</span><span class="d-value">{{ detail.start_time?.slice(0,5) }} - {{ detail.end_time?.slice(0,5) }}</span></div>
              <div class="d-row"><span class="d-label">Status</span><span><span class="status-badge" :class="'status-' + detail.status">{{ statusLabel(detail.status) }}</span></span></div>
            </div>
          </div>
          <div class="detail-card">
            <div class="detail-card-header"><span class="material-symbols-outlined">tune</span> Actions</div>
            <div class="detail-card-body">
              <div class="actions-grid">
                <button v-if="['pending','rescheduled'].includes(detail.status)" class="action-chip action-confirm" @click="updateStatus('confirmed')"><span class="material-symbols-outlined">check_circle</span> Confirm</button>
                <button v-if="detail.status === 'confirmed'" class="action-chip action-complete" @click="updateStatus('completed')"><span class="material-symbols-outlined">task_alt</span> Complete</button>
                <button v-if="['pending','confirmed','rescheduled'].includes(detail.status)" class="action-chip action-cancel" @click="updateStatus('cancelled')"><span class="material-symbols-outlined">cancel</span> Cancel</button>
                <button v-if="['confirmed','rescheduled'].includes(detail.status)" class="action-chip action-noshow" @click="updateStatus('no_show')"><span class="material-symbols-outlined">visibility_off</span> No Show</button>
                <button v-if="['cancelled','completed','no_show','archived'].includes(detail.status)" class="action-chip action-reopen" @click="updateStatus('pending')"><span class="material-symbols-outlined">undo</span> Reopen</button>
                <button v-if="['cancelled','completed','no_show'].includes(detail.status)" class="action-chip action-archive" @click="updateStatus('archived')"><span class="material-symbols-outlined">archive</span> Archive</button>
                <button v-if="isSuperAdmin" class="action-chip action-delete" @click="handleDelete"><span class="material-symbols-outlined">delete</span> Delete</button>
              </div>
              <div class="notes-section">
                <label class="notes-label">Admin Notes</label>
                <textarea v-model="notes" class="notes-input" rows="3"></textarea>
                <button class="notes-save" @click="saveNotes">Save Notes</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications + Audit Trail -->
        <div class="detail-cards-row" style="margin-top:1rem">
          <div class="detail-card">
            <div class="detail-card-header"><span class="material-symbols-outlined">notifications</span> Notifications</div>
            <div class="detail-card-body">
              <div v-if="notifications.length === 0" class="empty-text">No notifications sent.</div>
              <div v-for="n in notifications" :key="n.id" class="notif-row">
                <span class="notif-channel">{{ n.channel }}</span>
                <span class="notif-type">{{ n.type }}</span>
                <span class="status-badge" :class="n.status === 'sent' ? 'status-confirmed' : n.status === 'failed' ? 'status-cancelled' : 'status-pending'" style="font-size:10px">{{ n.status }}</span>
              </div>
            </div>
          </div>
          <div class="detail-card" style="grid-column:span 2">
            <div class="detail-card-header"><span class="material-symbols-outlined">history</span> Audit Trail</div>
            <div class="detail-card-body">
              <div v-if="auditLogs.length === 0" class="empty-text">No audit entries.</div>
              <div v-for="log in auditLogs" :key="log.created_at" class="audit-row">
                <span class="audit-time">{{ log.created_at }}</span>
                <span class="audit-action-label">{{ log.action }}</span>
                <span v-if="log.admin_name" class="audit-admin">by {{ log.admin_name }}</span>
              </div>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppointmentsStore } from '../../stores/appointments'
import { useAuthStore } from '../../stores/auth'
import { adminApi } from '../../api/admin'
import { statusLabel } from '../../utils/formatters'
import StatusBadge from '../../components/common/StatusBadge.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isSuperAdmin = computed(() => auth.user?.role === 'super_admin')
const store = useAppointmentsStore()
const detail = ref(null)
const notes = ref('')
const notifications = ref([])
const auditLogs = ref([])
const loading = ref(true)

async function updateStatus(status) {
  try {
    await adminApi.updateAppointmentStatus(route.params.id, { status, notes: notes.value })
    // If reopened to pending, go back to appointments list
    if (status === 'pending' && ['archived', 'cancelled', 'completed', 'no_show'].includes(detail.value?.status)) {
      router.push('/admin/appointments')
    } else {
      await fetchDetail()
    }
  } catch (err) {
    alert('Status update failed: ' + (err.response?.data?.error?.message || err.message))
  }
}

async function saveNotes() {
  await adminApi.updateAppointmentStatus(route.params.id, { notes: notes.value })
}

async function handleDelete() {
  if (!confirm('⚠️ Permanently delete this appointment? This cannot be undone.')) return
  try {
    await adminApi.deleteAppointment(route.params.id)
    alert('Appointment deleted')
    router.push('/admin/appointments')
  } catch (err) {
    alert('Delete failed: ' + (err.response?.data?.error?.message || 'Permission denied'))
  }
}

async function fetchDetail() {
  loading.value = true
  try {
    const { data } = await adminApi.getAppointmentDetail(route.params.id)
    detail.value = data.data
    notes.value = data.data.admin_notes || ''
    notifications.value = data.data.notifications || []
    auditLogs.value = data.data.audit_trail || []
  } catch {} finally { loading.value = false }
}

onMounted(fetchDetail)
</script>

<style scoped>
.header-title { font-size: 1.125rem; font-weight: 700; color: #121c28; font-family: monospace; }
.ap-header { position: sticky; top: 0; z-index: 20; background-color: #f8f9ff; border-bottom: 1px solid rgba(196,197,213,0.3); padding: 0.75rem 1.5rem; display: flex; align-items: center; }
.ap-header-left { display: flex; align-items: center; gap: 0.75rem; }
.menu-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: none; border-radius: 50%; color: #121c28; cursor: pointer; margin-left: -0.5rem; }
.menu-btn:hover { background-color: #dfe9fa; }
@media (min-width: 1024px) { .menu-btn { display: none; } }
.back-link { display: flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; color: #444653; text-decoration: none; padding: 0.375rem 0.625rem; border-radius: var(--radius-md); }
.back-link:hover { background-color: #dfe9fa; color: var(--color-primary); }

.ap-content { padding: 1.5rem; }

/* Detail Cards */
.detail-cards-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.detail-card { background-color: var(--color-white); border: 1px solid #c4c5d5; border-radius: var(--radius-xl); overflow: hidden; }
.detail-card-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background-color: #eef4ff; border-bottom: 1px solid #c4c5d5; font-size: 0.8125rem; font-weight: 700; color: #121c28; }
.detail-card-header .material-symbols-outlined { font-size: 1.125rem; color: var(--color-primary); }
.detail-card-body { padding: 0.75rem 1rem; }
.d-row { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; font-size: 0.8125rem; border-bottom: 1px solid rgba(196,197,213,0.15); }
.d-row:last-child { border-bottom: none; }
.d-label { color: #757684; font-weight: 500; }
.d-value { font-weight: 600; color: #121c28; text-align: right; max-width: 60%; }
.empty-text { font-size: 0.8125rem; color: #757684; text-align: center; padding: 0.5rem; }

/* Status badges */
.status-badge { display: inline-block; padding: 0.2rem 0.625rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; white-space: nowrap; }
.status-pending { background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.status-confirmed { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.status-rescheduled { background-color: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
.status-cancelled { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.status-completed { background-color: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db; }
.status-no_show { background-color: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.status-archived { background-color: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }

/* Action chips */
.actions-grid { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 1rem; }
.action-chip { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; cursor: pointer; border: 1px solid; transition: all 0.15s; white-space: nowrap; }
.action-chip .material-symbols-outlined { font-size: 1rem; }
.action-chip:hover { filter: brightness(1.1); transform: translateY(-1px); }
.action-confirm { background-color: #ecfdf5; color: #059669; border-color: #a7f3d0; }
.action-complete { background-color: #ecfdf5; color: #059669; border-color: #a7f3d0; }
.action-cancel { background-color: #fef2f2; color: #dc2626; border-color: #fecaca; }
.action-noshow { background-color: #fff7ed; color: #c2410c; border-color: #fed7aa; }
.action-reopen { background-color: #eef4ff; color: #1e40af; border-color: #b8c4ff; }
.action-archive { background-color: #f3f4f6; color: #6b7280; border-color: #d1d5db; }
.action-delete { background-color: #fef2f2; color: #dc2626; border-color: #fecaca; }

/* Notes */
.notes-section { border-top: 1px solid #e5e7eb; padding-top: 0.75rem; }
.notes-label { display: block; font-size: 0.75rem; font-weight: 600; color: #757684; margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.05em; }
.notes-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: var(--radius-md); font-size: 0.8125rem; outline: none; resize: vertical; font-family: inherit; }
.notes-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(217,119,6,0.15); }
.notes-save { margin-top: 0.5rem; padding: 0.375rem 1rem; background-color: var(--color-primary); color: var(--color-white); border: none; border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 600; cursor: pointer; }
.notes-save:hover { background-color: var(--color-primary-hover); }

/* Notifications */
.notif-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem 0; font-size: 0.8125rem; border-bottom: 1px solid rgba(196,197,213,0.15); }
.notif-row:last-child { border-bottom: none; }
.notif-channel { font-weight: 600; color: #121c28; min-width: 40px; text-transform: uppercase; font-size: 0.6875rem; }
.notif-type { color: #444653; flex: 1; }
.notif-status { margin-left: auto; }

/* Audit Trail */
.audit-row { display: flex; gap: 1rem; padding: 0.35rem 0; font-size: 0.8125rem; border-bottom: 1px solid rgba(196,197,213,0.15); align-items: center; }
.audit-row:last-child { border-bottom: none; }
.audit-time { color: #757684; min-width: 170px; font-size: 0.75rem; }
.audit-action-label { font-weight: 600; color: #121c28; }
.audit-admin { color: #757684; font-size: 0.75rem; margin-left: auto; }

@media (max-width: 768px) { .detail-cards-row { grid-template-columns: 1fr; } }
</style>
