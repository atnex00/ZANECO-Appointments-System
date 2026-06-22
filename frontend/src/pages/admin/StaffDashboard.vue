<template>
  <div class="staff-page">
    <header class="staff-header">
      <div>
        <p class="staff-office">{{ officeName }}</p>
        <h1 class="staff-date">{{ todayLabel }}</h1>
      </div>
      <div class="staff-stats">
        <div class="staff-stat"><span class="stat-num">{{ appointments.length }}</span>Total</div>
        <div class="staff-stat"><span class="stat-num stat-waiting">{{ waiting.length }}</span>Waiting</div>
        <div class="staff-stat"><span class="stat-num stat-done">{{ completed.length }}</span>Done</div>
      </div>
    </header>

    <div class="staff-tabs">
      <button v-for="t in tabs" :key="t.key" class="staff-tab" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">{{ t.label }} <span class="tab-count">{{ t.count }}</span></button>
    </div>

    <div class="staff-queue">
      <div v-if="filtered.length === 0" class="staff-empty">
        <span class="material-symbols-outlined" style="font-size:3rem;color:var(--color-gray-300)">event_busy</span>
        <p>No appointments in this category</p>
      </div>

      <div v-for="apt in filtered" :key="apt.id" class="staff-card" :class="{ expanded: expandedId === apt.id, 'card-completed': apt.status === 'completed', 'card-noshow': apt.status === 'no_show' }" @click="toggleExpand(apt.id)">
        <div class="card-main">
          <div class="card-time">{{ formatTime(apt.start_time) }}</div>
          <div class="card-info">
            <p class="card-name">{{ apt.consumer_name }}</p>
            <p class="card-concern">{{ apt.concern_type }}</p>
          </div>
          <span class="status-badge" :class="'status-' + apt.status">{{ apt.status }}</span>
        </div>

        <div v-if="expandedId === apt.id" class="card-detail">
          <div class="detail-grid">
            <div><span class="detail-label">Ref #</span><span class="detail-val mono">{{ apt.reference_number }}</span></div>
            <div><span class="detail-label">Account</span><span class="detail-val">{{ apt.account_number }}</span></div>
            <div><span class="detail-label">Mobile</span><span class="detail-val">{{ apt.mobile_number }}</span></div>
            <div v-if="apt.email"><span class="detail-label">Email</span><span class="detail-val">{{ apt.email }}</span></div>
          </div>

          <div class="detail-actions">
            <button v-if="apt.status === 'pending'" class="action-btn action-confirm" @click.stop="confirmArrival(apt)">
              <span class="material-symbols-outlined">check_circle</span> Mark Arrived
            </button>
            <button v-if="apt.status === 'confirmed'" class="action-btn action-confirm" @click.stop="openComplete(apt)">
              <span class="material-symbols-outlined">task_alt</span> Complete Service
            </button>
            <button v-if="['pending', 'confirmed'].includes(apt.status)" class="action-btn action-cancel" @click.stop="markNoShow(apt)">
              <span class="material-symbols-outlined">visibility_off</span> No Show
            </button>
            <button v-if="apt.status === 'no_show'" class="action-btn action-reopen" @click.stop="reopen(apt)">
              <span class="material-symbols-outlined">undo</span> Reopen
            </button>
            <button v-if="apt.status === 'completed'" class="action-btn action-reopen" @click.stop="reopen(apt)">
              <span class="material-symbols-outlined">undo</span> Reopen
            </button>
          </div>

          <div v-if="apt.admin_notes" class="detail-notes">
            <span class="detail-label">Notes:</span>
            <p>{{ apt.admin_notes }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Complete Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCompleteModal" class="modal-overlay" @click.self="showCompleteModal = false">
          <div class="complete-modal">
            <div class="complete-header">
              <h3>Complete Service</h3>
              <button class="modal-close" @click="showCompleteModal = false">&times;</button>
            </div>
            <div class="complete-body">
              <p class="complete-consumer"><strong>{{ completingApt?.consumer_name }}</strong></p>
              <p class="complete-ref">{{ completingApt?.reference_number }}</p>
              <div class="form-group">
                <label class="form-label">Service Notes</label>
                <textarea v-model="serviceNotes" class="form-input" rows="4" placeholder="What was done? Any follow-up needed?"></textarea>
              </div>
            </div>
            <div class="complete-footer">
              <button class="btn btn-secondary" @click="showCompleteModal = false">Cancel</button>
              <button class="btn btn-primary" @click="completeService" :disabled="saving">
                {{ saving ? 'Saving...' : 'Mark as Completed' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminApi } from '../../api/admin'

const appointments = ref([])
const offices = ref([])
const activeTab = ref('all')
const expandedId = ref(null)
const showCompleteModal = ref(false)
const completingApt = ref(null)
const serviceNotes = ref('')
const saving = ref(false)

const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

const officeName = computed(() => {
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}')
  if (!user.office_id) return 'All Offices'
  const office = offices.value.find(o => o.id === user.office_id)
  return office?.name || 'Office'
})

const waiting = computed(() => appointments.value.filter(a => a.status === 'pending' || a.status === 'confirmed'))
const completed = computed(() => appointments.value.filter(a => a.status === 'completed'))
const noShow = computed(() => appointments.value.filter(a => a.status === 'no_show'))

const tabs = computed(() => [
  { key: 'all', label: 'All', count: appointments.value.length },
  { key: 'waiting', label: 'Waiting', count: waiting.value.length },
  { key: 'completed', label: 'Completed', count: completed.value.length },
  { key: 'noshow', label: 'No Show', count: noShow.value.length },
])

const filtered = computed(() => {
  if (activeTab.value === 'all') return appointments.value
  if (activeTab.value === 'waiting') return waiting.value
  if (activeTab.value === 'completed') return completed.value
  if (activeTab.value === 'noshow') return noShow.value
  return appointments.value
})

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  const ampm = hr >= 12 ? 'PM' : 'AM'
  const hr12 = hr % 12 || 12
  return `${hr12}:${m} ${ampm}`
}

async function fetchAppointments() {
  try {
    const { data } = await adminApi.getTodayAppointments()
    appointments.value = data.data || []
  } catch {}
}

async function fetchOffices() {
  try {
    const { data } = await adminApi.getOffices()
    offices.value = data.data || []
  } catch {}
}

async function confirmArrival(apt) {
  try {
    await adminApi.updateAppointmentStatus(apt.id, { status: 'confirmed' })
    apt.status = 'confirmed'
  } catch {}
}

function openComplete(apt) {
  completingApt.value = apt
  serviceNotes.value = apt.admin_notes || ''
  showCompleteModal.value = true
}

async function completeService() {
  if (!completingApt.value) return
  saving.value = true
  try {
    await adminApi.updateAppointmentStatus(completingApt.value.id, { status: 'completed', notes: serviceNotes.value })
    completingApt.value.status = 'completed'
    completingApt.value.admin_notes = serviceNotes.value
    showCompleteModal.value = false
    completingApt.value = null
  } catch {} finally {
    saving.value = false
  }
}

async function markNoShow(apt) {
  try {
    await adminApi.updateAppointmentStatus(apt.id, { status: 'no_show' })
    apt.status = 'no_show'
  } catch {}
}

async function reopen(apt) {
  try {
    await adminApi.updateAppointmentStatus(apt.id, { status: 'pending' })
    apt.status = 'pending'
  } catch {}
}

onMounted(() => { fetchAppointments(); fetchOffices() })
</script>

<style scoped>
.staff-page {
  padding: 1.5rem;
  max-width: 720px;
  margin: 0 auto;
}

.staff-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.staff-office {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.staff-date {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-gray-900);
  margin-top: 0.125rem;
}

.staff-stats {
  display: flex;
  gap: 1rem;
}

.staff-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  font-weight: 500;
}

.stat-num {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-gray-900);
}

.stat-waiting { color: #d97706; }
.stat-done { color: #059669; }

/* Tabs */
.staff-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.staff-tabs::-webkit-scrollbar { display: none; }

.staff-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: none;
  background: none;
  border-radius: 9999px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-500);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
}

.staff-tab:hover { background-color: var(--color-gray-100); color: var(--color-gray-700); }
.staff-tab.active { background-color: var(--color-primary); color: var(--color-white); }

.tab-count {
  font-size: var(--font-size-xs);
  background: rgba(255,255,255,0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
}

.staff-tab.active .tab-count { background: rgba(255,255,255,0.25); }

/* Empty state */
.staff-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem;
  color: var(--color-gray-400);
  font-size: var(--font-size-sm);
}

/* Cards */
.staff-queue {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.staff-card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s;
}

.staff-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); }

.staff-card.card-completed { opacity: 0.7; }
.staff-card.card-completed:hover { opacity: 1; }
.staff-card.card-noshow { opacity: 0.6; }

.card-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.125rem;
}

.card-time {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-gray-900);
  min-width: 5rem;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-gray-900);
}

.card-concern {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  margin-top: 0.125rem;
}

/* Detail */
.card-detail {
  border-top: 1px solid var(--color-border);
  padding: 1rem 1.125rem;
  animation: slideDown 0.2s ease both;
}

@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.detail-label {
  display: block;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.125rem;
}

.detail-val {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-900);
}

.detail-val.mono { font-family: monospace; letter-spacing: 0.05em; }

.detail-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.action-confirm { background-color: #d1fae5; color: #065f46; }
.action-confirm:hover { background-color: #a7f3d0; }
.action-cancel { background-color: #fee2e2; color: #991b1b; }
.action-cancel:hover { background-color: #fecaca; }
.action-reopen { background-color: #eef4ff; color: #1e40af; }
.action-reopen:hover { background-color: #dbeafe; }

.detail-notes {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: var(--color-gray-50);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  line-height: 1.5;
}

/* Complete Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.complete-modal {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-xl);
}

.complete-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.complete-header h3 { font-size: 1.125rem; font-weight: 700; }

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-gray-500);
  padding: 0;
  line-height: 1;
}

.complete-body {
  padding: 1.25rem 1.5rem;
}

.complete-consumer { font-size: var(--font-size-lg); margin-bottom: 0.25rem; }
.complete-ref { font-size: var(--font-size-sm); color: var(--color-gray-500); font-family: monospace; margin-bottom: 1rem; }

.form-group { margin-bottom: 0; }
.form-label { display: block; font-size: var(--font-size-sm); font-weight: 600; color: #374151; margin-bottom: 0.375rem; }
.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: var(--radius-md);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  resize: vertical;
}
.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(217,119,6,0.15); }

.complete-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-xl);
  font-weight: 600;
  font-size: var(--font-size-sm);
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:active { transform: scale(0.97); }

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover { background-color: var(--color-primary-hover); }

.btn-secondary {
  background-color: var(--color-white);
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
}

.btn-secondary:hover { background-color: var(--color-gray-50); }

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  white-space: nowrap;
}

.status-pending { background-color: #fef3c7; color: #92400e; }
.status-confirmed { background-color: #dbeafe; color: #1e40af; }
.status-rescheduled { background-color: #f3e8ff; color: #6b21a8; }
.status-completed { background-color: #d1fae5; color: #065f46; }
.status-cancelled { background-color: #fee2e2; color: #991b1b; }
.status-noshow { background-color: #f3f4f6; color: #4b5563; }
.status-archived { background-color: #f3f4f6; color: #6b7280; }

/* Modal transitions */
.modal-enter-active { transition: opacity 0.2s ease; }
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-active .complete-modal { animation: modalSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) both; }
.modal-leave-active .complete-modal { animation: modalSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) reverse both; }
@keyframes modalSlideIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>
