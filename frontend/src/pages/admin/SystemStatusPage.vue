<template>
  <div class="status-page">
    <div class="status-shell">
      <header class="status-header">
        <h1 class="status-title">System Status</h1>
        <p class="status-subtitle">Real-time health overview of the ZANECO Appointments System</p>
      </header>

      <div v-if="error" class="alert-error">
        <span class="material-symbols-outlined">error</span>
        {{ error }}
      </div>

      <div v-if="loading" class="loading-state">
        <span class="material-symbols-outlined spin">sync</span>
        Checking system status...
      </div>

      <Transition name="fade-up" mode="out-in">
        <div v-if="data && !loading" key="content">
          <!-- Overall Status -->
          <section class="overall-card" :class="data.status === 'operational' ? 'status-ok' : 'status-warn'" style="animation-delay: 0s;">
            <span class="material-symbols-outlined overall-icon">{{ data.status === 'operational' ? 'check_circle' : 'warning' }}</span>
            <div class="overall-text">
              <strong>{{ data.status === 'operational' ? 'All Systems Operational' : 'System Degraded' }}</strong>
              <span>Last checked: {{ formatTime(data.checkedAt) }}</span>
            </div>
            <span class="overall-badge">{{ data.environment }}</span>
          </section>

          <!-- Metric Cards -->
          <div class="metrics-grid" key="cards">
            <div class="metric-card" style="animation-delay: 0.05s;">
              <span class="metric-icon material-symbols-outlined">database</span>
              <div class="metric-body">
                <span class="metric-label">Database</span>
                <div class="metric-value">
                  <span class="dot" :class="data.database.healthy ? 'dot-ok' : 'dot-err'"></span>
                  {{ data.database.healthy ? 'Connected' : 'Disconnected' }}
                </div>
                <span v-if="data.database.error" class="metric-hint">{{ data.database.error }}</span>
              </div>
            </div>

            <div class="metric-card" style="animation-delay: 0.1s;">
              <span class="metric-icon material-symbols-outlined">email</span>
              <div class="metric-body">
                <span class="metric-label">Email Service</span>
                <div class="metric-value">
                  <span class="dot" :class="data.email.configured ? 'dot-ok' : 'dot-err'"></span>
                  {{ data.email.configured ? 'Configured' : 'Not Configured' }}
                </div>
              </div>
            </div>

            <div class="metric-card" style="animation-delay: 0.15s;">
              <span class="metric-icon material-symbols-outlined">schedule</span>
              <div class="metric-body">
                <span class="metric-label">Appointments Today</span>
                <div class="metric-value">{{ data.appointments.today }}</div>
              </div>
            </div>

            <div class="metric-card" style="animation-delay: 0.2s;">
              <span class="metric-icon material-symbols-outlined">pending_actions</span>
              <div class="metric-body">
                <span class="metric-label">Pending</span>
                <div class="metric-value">{{ data.appointments.pending }}</div>
              </div>
            </div>

            <div class="metric-card" style="animation-delay: 0.25s;">
              <span class="metric-icon material-symbols-outlined">uptime</span>
              <div class="metric-body">
                <span class="metric-label">Uptime</span>
                <div class="metric-value">{{ currentUptime }}</div>
              </div>
            </div>

            <div class="metric-card" style="animation-delay: 0.3s;">
              <span class="metric-icon material-symbols-outlined">memory</span>
              <div class="metric-body">
                <span class="metric-label">Memory (Heap)</span>
                <div class="metric-value">{{ data.memory.heapUsed }} MB</div>
                <span class="metric-hint">of {{ data.memory.heapTotal }} MB</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <footer class="status-footer">
        <button class="refresh-btn" @click="fetchStatus" :disabled="loading">
          <span class="material-symbols-outlined" :class="{ spin: loading }">refresh</span>
          Refresh
        </button>
        <router-link class="back-link" to="/admin/login">Back to Login</router-link>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { adminApi } from '../../api/admin'

const data = ref(null)
const loading = ref(true)
const error = ref('')
const startedAt = ref(null)
const baseUptime = ref(0)
const tick = ref(0)
let ticker = null

const currentUptime = computed(() => {
  if (!startedAt.value) return '—'
  void tick.value
  const elapsed = Math.floor((Date.now() - startedAt.value) / 1000)
  const total = baseUptime.value + elapsed
  return formatUptime(total)
})

async function fetchStatus() {
  loading.value = true
  error.value = ''
  try {
    const res = await adminApi.getSystemStatus()
    data.value = res.data.data
    baseUptime.value = res.data.data.uptime
    startedAt.value = new Date(res.data.data.checkedAt).getTime()
  } catch (err) {
    error.value = err.response?.data?.error?.message || 'Failed to fetch system status'
  } finally {
    loading.value = false
  }
}

function formatTime(iso) {
  return new Date(iso).toLocaleString()
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts = []
  if (d) parts.push(d + 'd')
  if (h) parts.push(h + 'h')
  if (m) parts.push(m + 'm')
  parts.push(s + 's')
  return parts.join(' ')
}

onMounted(() => {
  fetchStatus()
  ticker = setInterval(() => {
    tick.value++
  }, 1000)
})

onUnmounted(() => {
  if (ticker) clearInterval(ticker)
})
</script>

<style scoped>
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.status-page { width: 100%; min-height: 100vh; background: #f8f9ff; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; font-family: 'Inter', sans-serif; }
.status-shell { width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 1.5rem; }
.status-title { font-family: 'Hanken Grotesk', sans-serif; font-size: 1.75rem; font-weight: 700; color: #121c28; margin: 0; letter-spacing: -0.02em; }
.status-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0; }

.alert-error { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 0.875rem; border-radius: 8px; }
.loading-state { display: flex; align-items: center; gap: 0.5rem; padding: 2rem; justify-content: center; color: #6b7280; font-size: 0.875rem; }

.overall-card { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; border-radius: 12px; animation: fadeSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both; }
.overall-card.status-ok { background: #ecfdf5; border: 1px solid #a7f3d0; }
.overall-card.status-warn { background: #fffbeb; border: 1px solid #fde68a; }
.overall-icon { font-size: 1.5rem; }
.status-ok .overall-icon { color: #059669; }
.status-warn .overall-icon { color: #d97706; }
.overall-text { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }
.overall-text strong { font-size: 0.9375rem; color: #111827; }
.overall-text span { font-size: 0.75rem; color: #6b7280; }
.overall-badge { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.25rem 0.625rem; background: rgba(0,0,0,0.06); border-radius: 999px; color: #6b7280; }

.metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.metric-card { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; animation: fadeSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both; }
.metric-icon { font-size: 1.25rem; color: #d97706; margin-top: 0.125rem; }
.metric-body { display: flex; flex-direction: column; gap: 0.125rem; }
.metric-label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }
.metric-value { font-size: 1.125rem; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 0.375rem; }
.metric-hint { font-size: 0.6875rem; color: #9ca3af; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.dot-ok { background: #059669; }
.dot-err { background: #dc2626; }

.fade-up-enter-active { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-up-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-up-enter-from { opacity: 0; transform: translateY(12px); }
.fade-up-leave-to { opacity: 0; transform: translateY(-8px); }

.status-footer { display: flex; align-items: center; justify-content: space-between; }
.refresh-btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; background: #ffffff; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.8125rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.15s; }
.refresh-btn:hover { background: #f9fafb; border-color: #9ca3af; }
.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.back-link { font-size: 0.8125rem; color: #d97706; text-decoration: none; font-weight: 600; }
.back-link:hover { text-decoration: underline; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
