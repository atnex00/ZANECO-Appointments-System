<template>
  <div>
    <header class="ap-header">
      <div class="ap-header-left">
        <h2 class="header-title">Concern Types</h2>
        <button class="ap-new-btn" @click="openAdd"><span class="material-symbols-outlined">add</span> Add Concern</button>
      </div>
    </header>

    <div class="ap-content">
      <div class="ap-table-wrap">
        <div class="ap-table-scroll">
          <table class="ap-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Duration</th>
                <th>Sort</th>
                <th>Status</th>
                <th class="th-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ct in concernTypes" :key="ct.id" class="ap-row">
                <td class="td-name">{{ ct.name }}</td>
                <td class="td-muted" style="font-family:monospace">{{ ct.code }}</td>
                <td class="td-date">{{ ct.estimatedDurationMinutes }} min</td>
                <td class="td-date">{{ ct.sortOrder }}</td>
                <td><span class="badge" :class="ct.isActive ? 'badge-confirmed' : 'badge-cancelled'">{{ ct.isActive ? 'Active' : 'Inactive' }}</span></td>
                <td class="td-actions">
                  <button class="row-action" @click="editItem(ct)" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                  <button class="row-action" @click="toggleActive(ct)" title="Toggle"><span class="material-symbols-outlined">power_settings_new</span></button>
                </td>
              </tr>
              <tr v-if="concernTypes.length === 0"><td colspan="6" class="td-empty">No concern types.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Edit Modal -->
      <Teleport to="body">
        <Transition name="modal">
        <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
          <div class="schedule-modal">
            <div class="schedule-modal-header">
              <h3>{{ editingItem ? 'Edit Concern Type' : 'Add Concern Type' }}</h3>
              <button class="modal-close" @click="showForm = false">&times;</button>
            </div>
            <div class="schedule-modal-body">
              <div class="form-group"><label class="form-label">Name</label><input v-model="form.name" class="form-input" /></div>
              <div class="form-group"><label class="form-label">Code</label><input v-model="form.code" class="form-input" /></div>
              <div class="form-group"><label class="form-label">Description</label><textarea v-model="form.description" class="form-input" rows="2"></textarea></div>
              <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem">
                <div class="form-group"><label class="form-label">Duration (min)</label><input v-model.number="form.estimated_duration_minutes" type="number" class="form-input" /></div>
                <div class="form-group"><label class="form-label">Sort Order</label><input v-model.number="form.sort_order" type="number" class="form-input" /></div>
                <div class="form-group"><label class="form-label">Active</label><select v-model="form.is_active" class="form-select"><option :value="true">Active</option><option :value="false">Inactive</option></select></div>
              </div>
            </div>
            <div class="schedule-modal-footer">
              <button class="btn btn-secondary" @click="showForm = false">Cancel</button>
              <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
            </div>
          </div>
        </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '../../api/admin'
import { useToast } from '../../composables/useToast'


const toast = useToast()

const concernTypes = ref([])
const loading = ref(true)
const showForm = ref(false)
const editingItem = ref(null)
const saving = ref(false)
const form = ref({ name: '', code: '', description: '', estimated_duration_minutes: 30, sort_order: 0, is_active: true })

async function fetchData() {
  try { const { data } = await adminApi.getConcernTypes(); concernTypes.value = data.data } catch (err) { console.error('Fetch concern types failed:', err) } finally { loading.value = false }
}
function openAdd() { editingItem.value = null; form.value = { name: '', code: '', description: '', estimated_duration_minutes: 30, sort_order: 0, is_active: true }; showForm.value = true }
function editItem(item) {
  editingItem.value = item
  form.value = {
    name: item.name,
    code: item.code,
    description: item.description || '',
    estimated_duration_minutes: item.estimatedDurationMinutes ?? 30,
    sort_order: item.sortOrder ?? 0,
    is_active: item.isActive ?? true,
  }
  showForm.value = true
}
async function toggleActive(ct) {
  try {
    await adminApi.updateConcernType(ct.id, { is_active: !ct.isActive })
    await fetchData()
  } catch (err) {
    console.error('Toggle concern type failed:', err)
  }
}
async function save() {
  if (!form.value.name || !form.value.code) { toast.warning('Name and code are required'); return }
  saving.value = true
  try {
    if (editingItem.value) await adminApi.updateConcernType(editingItem.value.id, form.value)
    else await adminApi.createConcernType(form.value)
    showForm.value = false; editingItem.value = null; await fetchData()
  } catch (err) {
    toast.error('Error: ' + (err.response?.data?.error?.message || err.message))
  } finally { saving.value = false }
}
onMounted(fetchData)
</script>

<style scoped>
.header-title { font-size: 1.25rem; font-weight: 600; color: var(--color-gray-900); white-space: nowrap; }
.ap-header { position: sticky; top: 0; z-index: 20; background-color: var(--color-primary-light); border-bottom: 1px solid rgba(229,231,235,0.3); padding: 0.75rem 1.5rem; display: flex; align-items: center; }
.ap-header-left { display: flex; align-items: center; gap: 0.75rem; }
.menu-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: none; border-radius: 50%; color: var(--color-gray-900); cursor: pointer; margin-left: -0.5rem; }
.menu-btn:hover { background-color: var(--color-primary-muted); }
@media (min-width: 1024px) { .menu-btn { display: none; } }
.ap-new-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: var(--radius-xl); background-color: var(--color-primary); border: none; color: var(--color-white); font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap; margin-left: auto; }
.ap-new-btn:hover { filter: brightness(1.1); }

.ap-content { padding: 1.5rem; }
.ap-table-wrap { background-color: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; }
.ap-table-scroll { overflow-x: auto; }
.ap-table { width: 100%; min-width: 700px; border-collapse: collapse; }
.ap-table th { padding: 1rem 1.25rem; background-color: var(--color-primary-muted); border-bottom: 1px solid var(--color-border); font-size: 0.75rem; font-weight: 600; color: var(--color-gray-600); text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
.th-right { text-align: right; }
.ap-table td { padding: 0.75rem 1.25rem; font-size: 0.875rem; border-bottom: 1px solid rgba(229,231,235,0.3); }
.ap-row:hover td { background-color: var(--color-primary-muted); }
.td-name { font-weight: 600; color: var(--color-gray-900); }
.td-muted { color: var(--color-gray-600); }
.td-date { color: var(--color-gray-900); }
.td-empty { text-align: center; color: var(--color-gray-400); padding: 2rem; }
.td-actions { text-align: right; white-space: nowrap; }
.row-action { padding: 0.375rem; border: none; background: none; border-radius: 50%; color: var(--color-gray-600); cursor: pointer; vertical-align: middle; }
.row-action:hover { background-color: #fde68a; }

.status-confirmed { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.status-cancelled { background-color: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db; }

/* Modal transitions */
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
.schedule-modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--color-border); }
.form-group { margin-bottom: 1rem; }
.form-label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.375rem; }
.form-input { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #d1d5db; border-radius: var(--radius-md); font-size: 1rem; outline: none; transition: border-color 0.15s; }
.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(217,119,6,0.15); }
.form-select { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #d1d5db; border-radius: var(--radius-md); font-size: 1rem; outline: none; background: var(--color-white); }
</style>
