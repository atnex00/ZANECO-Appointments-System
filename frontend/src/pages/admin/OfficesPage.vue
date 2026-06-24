<template>
  <div>
    <!-- Header -->
    <header class="admin-header">
      <div class="header-left">
        <h2 class="header-title">Offices</h2>
      </div>
      <div class="header-center">
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input v-model="searchTerm" class="search-input" placeholder="Search by name, address, or region..." />
        </div>
        <button class="filter-btn">
          <span class="material-symbols-outlined">filter_list</span> Filter
        </button>
      </div>
    </header>

    <!-- Content -->
    <div class="admin-content">
      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">TOTAL OFFICES</span>
          <span class="stat-value" style="color:var(--color-primary)">{{ offices.length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">ACTIVE NOW</span>
          <div class="stat-inline">
            <span class="stat-value" style="color:var(--color-success)">{{ activeCount }}</span>
            <span class="stat-sub">{{ Math.round((activeCount / offices.length) * 100) }}% Uptime</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-label">AVG CAPACITY</span>
          <span class="stat-value" style="color:var(--color-gray-800)">{{ avgCapacity }} <small style="font-size:0.875rem;font-weight:400">slots/hr</small></span>
        </div>
      </div>

      <!-- Office Cards Grid -->
      <div class="office-grid">
        <div v-for="office in filteredOffices" :key="office.id" class="office-card" :class="{ 'office-card-inactive': !office.active }">
          <div class="status-strip" :class="office.active ? 'strip-active' : 'strip-inactive'"></div>
          <div class="office-card-body">
            <div class="office-card-top">
              <div class="office-card-info">
                <div class="office-icon-box">
                  <span class="material-symbols-outlined office-icon">location_on</span>
                </div>
                <div>
                  <h3 class="office-name">{{ office.name }}</h3>
                  <p class="office-address">
                    <span class="material-symbols-outlined" style="font-size:1rem">map</span>
                    <span>{{ office.address }}</span>
                  </p>
                </div>
              </div>
              <label class="switch">
                <input type="checkbox" :checked="office.active" @change="toggleOffice(office.id)" />
                <span class="slider"></span>
              </label>
            </div>

            <div class="office-details">
              <div class="detail-row">
                <span class="detail-label uppercase">Contact</span>
                <span class="detail-value">{{ office.phone || 'N/A' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label uppercase">Hours</span>
                <span class="detail-value">{{ office.opening_time?.slice(0,5) || '08:00' }} - {{ office.closing_time?.slice(0,5) || '17:00' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label uppercase">Capacity</span>
                <span class="detail-value" style="color:var(--color-primary);font-weight:700">{{ office.slot_capacity || 2 }} slots/hr</span>
              </div>
              <div class="progress-bar-wrap">
                <div class="progress-bar" :style="{ width: (office.slot_capacity ? Math.min(100, (office.slot_capacity / 5) * 100) : 40) + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="office-card-actions">
            <button class="action-btn action-primary" @click="editOffice(office)">Edit Details</button>
            <button class="action-btn action-outline" @click="openSchedule(office)">Schedule</button>
            <button class="action-btn action-primary" @click="generateSlots(office)">Generate Slots</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Schedule Modal -->
    <Teleport to="body">
      <Transition name="modal">
      <div v-if="scheduleOffice" class="modal-overlay" @click.self="closeSchedule">
        <div class="schedule-modal">
          <div class="schedule-modal-header">
            <h3>{{ scheduleOffice.name }} — Weekly Schedule</h3>
            <button class="modal-close" @click="closeSchedule">&times;</button>
          </div>
          <div class="schedule-modal-body">
            <div v-for="day in dayNames" :key="day.key" class="schedule-day-row">
              <div class="day-label">{{ day.label }}</div>
              <input type="time" v-model="scheduleData[day.key].open" class="schedule-time-input" />
              <span class="schedule-time-sep">to</span>
              <input type="time" v-model="scheduleData[day.key].close" class="schedule-time-input" />
              <label class="switch" style="margin-left:auto">
                <input type="checkbox" v-model="scheduleData[day.key].working" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
          <div class="schedule-modal-footer">
            <button class="btn btn-secondary" @click="closeSchedule">Cancel</button>
            <button class="btn btn-primary" @click="saveSchedule" :disabled="savingSchedule">{{ savingSchedule ? 'Saving...' : 'Save Schedule' }}</button>
          </div>
        </div>
      </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onMounted } from 'vue'
import { adminApi } from '../../api/admin'


const searchTerm = ref('')
const offices = ref([])

const fallbackOffices = [
  { id: 1, name: 'Main Office', code: 'MAIN', address: 'Poblacion, Dipolog City', phone: '(065) 212-3456', opening_time: '08:00:00', closing_time: '17:00:00', slot_capacity: 3, active: true },
  { id: 2, name: 'Sindangan Area Services', code: 'SAS', address: 'Sindangan, Zamboanga del Norte', phone: '(065) 213-4567', opening_time: '08:00:00', closing_time: '17:00:00', slot_capacity: 2, active: true },
  { id: 3, name: 'Liloy Area Services', code: 'LAS', address: 'Liloy, Zamboanga del Norte', phone: '(065) 214-5678', opening_time: '08:00:00', closing_time: '17:00:00', slot_capacity: 2, active: true },
  { id: 4, name: 'Piñan Area Services', code: 'PAS', address: 'Piñan, Zamboanga del Norte', phone: '(065) 215-6789', opening_time: '08:00:00', closing_time: '17:00:00', slot_capacity: 2, active: true },
  { id: 5, name: 'Dipolog Area Services', code: 'DAS', address: 'Minaog, Dipolog City, Zamboanga del Norte', phone: '(065) 216-7890', opening_time: '08:00:00', closing_time: '17:00:00', slot_capacity: 2, active: true },
]

const activeCount = computed(() => offices.value.filter(o => o.active !== false).length)
const avgCapacity = computed(() => {
  if (!offices.value.length) return 0
  return Math.round(offices.value.reduce((s, o) => s + (o.slot_capacity || 0), 0) / offices.value.length)
})

const filteredOffices = computed(() => {
  if (!searchTerm.value.trim()) return offices.value
  const q = searchTerm.value.toLowerCase()
  return offices.value.filter(o =>
    o.name.toLowerCase().includes(q) ||
    (o.address && o.address.toLowerCase().includes(q))
  )
})

function toggleOffice(id) {
  const o = offices.value.find(x => x.id === id)
  if (o) o.active = !o.active
}

onMounted(async () => {
  try {
    const { data } = await adminApi.getOffices()
    offices.value = (data.data || []).map(o => ({ ...o, active: o.is_active ?? true }))
  } catch {
    offices.value = fallbackOffices
  }
})

// Schedule modal
const scheduleOffice = ref(null)
const savingSchedule = ref(false)
const scheduleData = ref({})
const dayNames = [
  { key: 'monday', label: 'Monday' }, { key: 'tuesday', label: 'Tuesday' }, { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' }, { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' }, { key: 'sunday', label: 'Sunday' },
]

function openSchedule(office) {
  scheduleOffice.value = office
  scheduleData.value = {}
  for (const day of dayNames) {
    scheduleData.value[day.key] = { open: '08:00', close: '17:00', working: day.key !== 'saturday' && day.key !== 'sunday' }
  }
}

function closeSchedule() { scheduleOffice.value = null }

async function saveSchedule() {
  savingSchedule.value = true
  try {
    const schedules = dayNames.map(d => ({
      day_of_week: d.key,
      opening_time: scheduleData.value[d.key].open + ':00',
      closing_time: scheduleData.value[d.key].close + ':00',
      is_working_day: scheduleData.value[d.key].working,
    }))
    await adminApi.updateOfficeSchedule(scheduleOffice.value.id, { schedules })
  } catch (err) { console.error('Save schedule failed:', err) } finally { savingSchedule.value = false; scheduleOffice.value = null }
}

function editOffice(office) {
  alert(`Edit office: ${office.name} — feature coming soon`)
}

async function generateSlots(office) {
  if (!confirm(`Generate 30 days of time slots for ${office.name}?`)) return
  try {
    await adminApi.updateOffice(office.id, {})
  } catch (err) { console.error('Generate slots failed:', err); alert('Failed to generate time slots'); return }
  alert('Time slots generated successfully')
}
</script>

<style scoped>
.admin-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #f8f9ff;
  box-shadow: var(--shadow-sm);
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(196,197,213,0.3);
}
@media (min-width: 768px) {
  .admin-header { flex-direction: row; align-items: center; justify-content: space-between; }
}
.menu-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: none; border-radius: 50%; color: #121c28; cursor: pointer; margin-left: -0.5rem; }
.menu-btn:hover { background-color: #dfe9fa; }
@media (min-width: 1024px) { .menu-btn { display: none; } }
.menu-btn .material-symbols-outlined { font-size: 1.5rem; }
.header-left { display: flex; align-items: center; gap: 0.75rem; }
.header-title { font-size: 1.25rem; font-weight: 600; color: #121c28; }
.header-center { display: flex; gap: 0.75rem; flex: 1; max-width: 600px; }
.search-box {
  position: relative;
  flex: 1;
}
.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #757684;
  font-size: 1.25rem;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 3rem;
  border-radius: 9999px;
  border: 1px solid #c4c5d5;
  background-color: #eef4ff;
  font-size: 1rem;
  outline: none;
  transition: all 0.15s;
}
.search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(217,119,6,0.15); }
.search-input::placeholder { color: #757684; }
.filter-btn {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 1rem; border-radius: 9999px;
  background-color: #dfe9fa; border: 1px solid #c4c5d5;
  color: #121c28; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  transition: background 0.15s;
}
.filter-btn:hover { background-color: #d9e3f4; }
.filter-btn .material-symbols-outlined { font-size: 1.25rem; }

.admin-content { padding: 1.5rem; }

/* Stats */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.stat-card {
  background-color: #eef4ff; padding: 1rem; border-radius: var(--radius-xl);
  border: 1px solid #c4c5d5; display: flex; flex-direction: column; justify-content: space-between;
  min-height: 112px;
}
.stat-label { font-size: 0.75rem; font-weight: 600; color: #444653; text-transform: uppercase; letter-spacing: 0.05em; }
.stat-value { font-size: 1.75rem; font-weight: 700; }
.stat-inline { display: flex; align-items: flex-end; gap: 0.5rem; }
.stat-sub { font-size: 0.875rem; color: #4edea3; padding-bottom: 0.25rem; }

/* Office Cards */
.office-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1rem; }
.office-card {
  position: relative;
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  border: 1px solid #c4c5d5;
  overflow: hidden;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}
.office-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.office-card-inactive { opacity: 0.8; filter: grayscale(0.5); }

.status-strip {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}
.strip-active { background-color: var(--color-success); }
.strip-inactive { background-color: #757684; }

.office-card-body { padding: 1rem; flex: 1; }
.office-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
.office-card-info { display: flex; gap: 0.75rem; }
.office-icon-box {
  width: 48px; height: 48px; border-radius: var(--radius-lg);
  background-color: #dfe9fa; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.office-icon { font-size: 1.5rem; color: var(--color-primary); }
.office-name { font-size: 1.125rem; font-weight: 700; color: #121c28; }
.office-address { font-size: 0.875rem; color: #444653; display: flex; align-items: center; gap: 0.25rem; margin-top: 0.25rem; }

/* Toggle Switch */
.switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; inset: 0;
  background-color: #c4c5d5; transition: 0.3s; border-radius: 24px;
}
.slider:before {
  position: absolute; content: ""; height: 18px; width: 18px;
  left: 3px; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%;
}
.switch input:checked + .slider { background-color: var(--color-success); }
.switch input:checked + .slider:before { transform: translateX(20px); }

/* Details */
.office-details { padding: 0.75rem 0; border-top: 1px solid rgba(196,197,213,0.3); border-bottom: 1px solid rgba(196,197,213,0.3); }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 0.375rem 0; }
.detail-label { font-size: 0.75rem; font-weight: 600; color: #757684; letter-spacing: 0.025em; }
.detail-value { font-size: 0.875rem; font-weight: 500; color: #121c28; }
.progress-bar-wrap { height: 8px; width: 100%; background-color: #dfe9fa; border-radius: 9999px; overflow: hidden; margin-top: 0.5rem; }
.progress-bar { height: 100%; background-color: var(--color-primary); border-radius: 9999px; transition: width 0.3s; }

/* Actions */
.office-card-actions {
  padding: 0.75rem 1rem;
  background-color: rgba(248,249,255,0.5);
  display: flex; gap: 0.5rem; flex-wrap: wrap;
}
.action-btn {
  padding: 0.5rem 1rem; border-radius: var(--radius-lg);
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  border: none; transition: all 0.15s; white-space: nowrap;
}
.action-primary { background-color: var(--color-primary); color: var(--color-white); flex: 1; }
.action-primary:hover { filter: brightness(1.1); }
.action-outline { background: transparent; border: 1px solid var(--color-primary); color: var(--color-primary); flex: 1; }
.action-outline:hover { background-color: var(--color-primary-light); }
.action-icon { background: transparent; border: none; color: #444653; padding: 0.5rem; display: flex; align-items: center; }
.action-icon:hover { background-color: #dfe9fa; border-radius: var(--radius-lg); }

/* Schedule Modal */
.modal-enter-active { transition: opacity 0.2s ease; }
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-active .schedule-modal { animation: modalSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) both; }
.modal-leave-active .schedule-modal { animation: modalSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) reverse both; }
@keyframes modalSlideIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
.btn:active { transform: scale(0.97); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.schedule-modal { background: var(--color-white); border-radius: var(--radius-xl); width: 90vw; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-xl); }
.schedule-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); }
.schedule-modal-header h3 { font-size: 1.125rem; font-weight: 700; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-gray-500); padding: 0; line-height: 1; }
.modal-close:hover { color: var(--color-gray-900); }
.schedule-modal-body { padding: 1rem 1.5rem; }
.schedule-day-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0; border-bottom: 1px solid var(--color-gray-100); }
.day-label { width: 100px; font-weight: 600; font-size: var(--font-size-sm); }
.schedule-time-input { padding: 0.375rem 0.5rem; border: 1px solid var(--color-gray-300); border-radius: var(--radius-sm); font-size: var(--font-size-sm); width: 110px; outline: none; }
.schedule-time-input:focus { border-color: var(--color-primary); }
.schedule-time-sep { font-size: var(--font-size-sm); color: var(--color-gray-500); }
.schedule-modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--color-border); }
</style>
