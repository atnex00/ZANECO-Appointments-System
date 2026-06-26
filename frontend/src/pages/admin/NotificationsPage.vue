<template>
  <div>
    <header class="ap-header">
      <div class="ap-header-left">
        <h2 class="header-title">Notifications</h2>
      </div>
    </header>

    <div class="ap-content">
      <div class="ap-title-row">
        <div>
          <h2 class="ap-title">Notification Log</h2>
          <p class="ap-subtitle">Delivery status for SMS and email notifications.</p>
        </div>
      </div>

      <div class="ap-table-wrap">
        <div class="ap-table-scroll">
          <table class="ap-table">
            <thead>
              <tr>
                <th>Appointment</th>
                <th>Channel</th>
                <th>Type</th>
                <th>Recipient</th>
                <th>Status</th>
                <th>Retries</th>
                <th>Sent At</th>
                <th class="th-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in notifications" :key="n.id" class="ap-row">
                <td class="td-ref">{{ n.appointment_id }}</td>
                <td><span class="td-type-badge">{{ n.channel }}</span></td>
                <td class="td-date">{{ n.type }}</td>
                <td class="td-muted">{{ n.recipient }}</td>
                <td><span class="badge" :class="'badge-' + n.status">{{ n.status }}</span></td>
                <td class="td-date">{{ n.retry_count }}</td>
                <td class="td-muted">{{ n.sent_at || '-' }}</td>
                <td class="td-actions">
                  <button v-if="n.status === 'failed'" class="row-action" @click="resend(n.id)" title="Resend"><span class="material-symbols-outlined">refresh</span></button>
                </td>
              </tr>
              <tr v-if="notifications.length === 0"><td colspan="8" class="td-empty">No notifications sent yet.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="ap-pagination">
          <div class="ap-pagination-left">
            <span class="pagination-info">Showing {{ notifications.length }} of {{ total }} results</span>
          </div>
          <div class="ap-pagination-right">
            <button class="page-btn" :disabled="page <= 1" @click="changePage(page - 1)"><span class="material-symbols-outlined">chevron_left</span></button>
            <span class="page-info" style="padding:0 0.5rem;font-size:0.75rem">Page {{ page }} of {{ lastPage }}</span>
            <button class="page-btn" :disabled="page >= lastPage" @click="changePage(page + 1)"><span class="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '../../api/admin'
import { useToast } from '../../composables/useToast'


const toast = useToast()

const notifications = ref([])
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)

async function fetchData(p = 1) {
  page.value = p
  try {
    const { data } = await adminApi.getNotifications({ page: p, per_page: 20 })
    notifications.value = data.data.notifications || []
    total.value = data.data.pagination?.total || 0
    lastPage.value = data.data.pagination?.last_page || 1
  } catch (err) { console.error('Fetch notifications failed:', err) }
}

async function resend(id) {
  try { await adminApi.resendNotification(id); await fetchData(page.value) } catch (err) { console.error('Resend notification failed:', err); toast.error('Failed to resend notification') }
}

function changePage(p) { fetchData(p) }
onMounted(() => fetchData())
</script>

<style scoped>
.header-title { font-size: 1.25rem; font-weight: 600; color: var(--color-gray-900); }
.ap-header { position: sticky; top: 0; z-index: 20; background-color: var(--color-primary-light); border-bottom: 1px solid rgba(196,197,213,0.3); padding: 0.75rem 1.5rem; display: flex; align-items: center; }
.ap-header-left { display: flex; align-items: center; gap: 0.75rem; }
.menu-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: none; border-radius: 50%; color: var(--color-gray-900); cursor: pointer; margin-left: -0.5rem; }
.menu-btn:hover { background-color: var(--color-primary-muted); }
@media (min-width: 1024px) { .menu-btn { display: none; } }
.ap-content { padding: 1.5rem; }
.ap-title-row { margin-bottom: 1rem; }
.ap-title { font-size: 1.75rem; font-weight: 700; color: var(--color-gray-900); }
.ap-subtitle { font-size: 0.875rem; color: var(--color-gray-600); margin-top: 0.25rem; }
.ap-table-wrap { background-color: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; }
.ap-table-scroll { overflow-x: auto; }
.ap-table { width: 100%; min-width: 800px; border-collapse: collapse; }
.ap-table th { padding: 1rem 1.25rem; background-color: var(--color-primary-muted); border-bottom: 1px solid var(--color-border); font-size: 0.75rem; font-weight: 600; color: var(--color-gray-600); text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
.th-right { text-align: right; }
.ap-table td { padding: 0.75rem 1.25rem; font-size: 0.875rem; border-bottom: 1px solid rgba(196,197,213,0.3); }
.ap-row:hover td { background-color: var(--color-primary-muted); }
.td-ref { font-weight: 700; color: var(--color-primary); font-size: 0.8125rem; }
.td-muted { color: var(--color-gray-600); }
.td-date { color: var(--color-gray-900); }
.td-empty { text-align: center; color: var(--color-gray-400); padding: 2rem; }
.td-actions { text-align: right; white-space: nowrap; }
.td-type-badge { display: inline-block; padding: 0.25rem 0.625rem; background-color: var(--color-primary-muted); border-radius: 4px; font-size: 0.75rem; font-weight: 500; color: var(--color-gray-600); }
.row-action { padding: 0.375rem; border: none; background: none; border-radius: 50%; color: var(--color-gray-600); cursor: pointer; vertical-align: middle; }
.row-action:hover { background-color: #fde68a; }

.status-pending { background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.status-sent { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.status-failed { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.status-retrying { background-color: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.ap-pagination { padding: 0.75rem 1.25rem; background-color: var(--color-primary-muted); border-top: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
.page-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid var(--color-border); background: none; border-radius: var(--radius-lg); color: var(--color-gray-600); cursor: pointer; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:hover:not(:disabled) { background-color: var(--color-primary-muted); }
</style>
