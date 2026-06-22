<template>
  <div>
    <header class="ap-header">
      <div class="ap-header-left">
        <button class="menu-btn" @click="toggleDrawer(true)"><span class="material-symbols-outlined">menu</span></button>
        <h2 class="header-title">Admin Users</h2>
        <button v-if="isSuperAdmin" class="ap-new-btn" @click="openAdd"><span class="material-symbols-outlined">add</span> Add Admin</button>
      </div>
    </header>

    <div v-if="!isSuperAdmin" class="ap-content">
      <div class="access-denied">
        <span class="material-symbols-outlined" style="font-size:3rem;color:#dc2626">lock</span>
        <h2>Access Denied</h2>
        <p>Only Super Administrators can manage admin users.</p>
      </div>
    </div>

    <div v-else class="ap-content">
      <div class="ap-table-wrap">
        <div class="ap-table-scroll">
          <table class="ap-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Office</th>
                <th>Status</th>
                <th>Last Login</th>
                <th class="th-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" class="ap-row">
                <td class="td-name">{{ user.full_name }}</td>
                <td class="td-muted">{{ user.email }}</td>
                <td><span class="role-badge" :class="'role-' + user.role">{{ user.role }}</span></td>
                <td class="td-muted">{{ officeName(user.office_id) }}</td>
                <td><span class="status-badge" :class="user.is_active ? 'status-confirmed' : 'status-cancelled'">{{ user.is_active ? 'Active' : 'Inactive' }}</span></td>
                <td class="td-date">{{ user.last_login_at ? user.last_login_at.slice(0, 10) : 'Never' }}</td>
                <td class="td-actions">
                  <button class="row-action" @click="editUser(user)" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                  <button class="row-action" @click="toggleActive(user)" :title="user.is_active ? 'Deactivate' : 'Activate'" :style="{ color: user.is_active ? '#dc2626' : '#059669' }"><span class="material-symbols-outlined">{{ user.is_active ? 'block' : 'check_circle' }}</span></button>
                </td>
              </tr>
              <tr v-if="users.length === 0"><td colspan="7" class="td-empty">No admin users found.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <Teleport to="body">
        <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
          <div class="schedule-modal">
            <div class="schedule-modal-header">
              <h3>{{ editingUser ? 'Edit Admin User' : 'Add Admin User' }}</h3>
              <button class="modal-close" @click="showForm = false">&times;</button>
            </div>
            <div class="schedule-modal-body">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input v-model="form.full_name" class="form-input" placeholder="Juan Dela Cruz" />
              </div>
              <div class="form-group">
                <label class="form-label">Email *</label>
                <input v-model="form.email" class="form-input" type="email" placeholder="user@zaneco.ph" :disabled="editingUser" />
              </div>
              <div class="form-group" v-if="!editingUser">
                <label class="form-label">Password * (min 8 chars)</label>
                <input v-model="form.password" class="form-input" type="password" placeholder="••••••••" />
              </div>
              <div class="form-group" v-else>
                <label class="form-label">New Password (leave blank to keep current)</label>
                <input v-model="form.password" class="form-input" type="password" placeholder="Leave blank to keep current" />
              </div>
              <div class="form-row-3">
                <div class="form-group">
                  <label class="form-label">Role *</label>
                  <select v-model="form.role" class="form-select">
                    <option value="super_admin">Super Admin</option>
                    <option value="office_manager">Office Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Office</label>
                  <select v-model="form.office_id" class="form-select">
                    <option :value="null">— All Offices —</option>
                    <option v-for="o in offices" :key="o.id" :value="o.id">{{ o.name }}</option>
                  </select>
                </div>
                <div class="form-group" v-if="editingUser">
                  <label class="form-label">Active</label>
                  <select v-model="form.is_active" class="form-select">
                    <option :value="true">Active</option>
                    <option :value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="schedule-modal-footer">
              <button class="btn btn-secondary" @click="showForm = false">Cancel</button>
              <button class="btn btn-primary" @click="saveUser" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { adminApi } from '../../api/admin'

const toggleDrawer = inject('toggleDrawer', () => {})
const auth = useAuthStore()
const isSuperAdmin = computed(() => auth.user?.role === 'super_admin')

const users = ref([])
const offices = ref([])
const showForm = ref(false)
const editingUser = ref(null)
const saving = ref(false)
const form = ref({ full_name: '', email: '', password: '', role: 'staff', office_id: null, is_active: true })

async function fetchUsers() {
  try { const { data } = await adminApi.getUsers(); users.value = data.data || [] } catch {}
}

async function fetchOffices() {
  try { const { data } = await adminApi.getOffices(); offices.value = data.data || [] } catch {}
}

function officeName(id) {
  const o = offices.value.find(x => x.id === id)
  return o?.name || '—'
}

function openAdd() {
  editingUser.value = null
  form.value = { full_name: '', email: '', password: '', role: 'staff', office_id: null, is_active: true }
  showForm.value = true
}

function editUser(user) {
  editingUser.value = user
  form.value = { full_name: user.full_name, email: user.email, password: '', role: user.role, office_id: user.office_id, is_active: user.is_active }
  showForm.value = true
}

async function saveUser() {
  if (!form.value.full_name || !form.value.email) { alert('Name and email are required'); return }
  if (!editingUser.value && !form.value.password) { alert('Password is required for new users'); return }
  if (!editingUser.value && form.value.password.length < 8) { alert('Password must be at least 8 characters'); return }
  saving.value = true
  try {
    if (editingUser.value) {
      const payload = { full_name: form.value.full_name, role: form.value.role, office_id: form.value.office_id, is_active: form.value.is_active }
      if (form.value.password) payload.password = form.value.password
      await adminApi.updateUser(editingUser.value.id, payload)
    } else {
      await adminApi.createUser(form.value)
    }
    showForm.value = false
    editingUser.value = null
    await fetchUsers()
  } catch (err) {
    alert('Error: ' + (err.response?.data?.error?.message || err.message))
  } finally { saving.value = false }
}

async function toggleActive(user) {
  try {
    await adminApi.updateUser(user.id, { is_active: !user.is_active })
    await fetchUsers()
  } catch (err) {
    alert('Error: ' + (err.response?.data?.error?.message || err.message))
  }
}

onMounted(() => { fetchUsers(); fetchOffices() })
</script>

<style scoped>
.header-title { font-size: 1.25rem; font-weight: 600; color: #121c28; }
.ap-header { position: sticky; top: 0; z-index: 20; background-color: #f8f9ff; border-bottom: 1px solid rgba(196,197,213,0.3); padding: 0.75rem 1.5rem; display: flex; align-items: center; }
.ap-header-left { display: flex; align-items: center; gap: 0.75rem; }
.menu-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: none; border-radius: 50%; color: #121c28; cursor: pointer; margin-left: -0.5rem; }
.menu-btn:hover { background-color: #dfe9fa; }
@media (min-width: 1024px) { .menu-btn { display: none; } }
.ap-new-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: var(--radius-xl); background-color: var(--color-primary); border: none; color: var(--color-white); font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap; margin-left: auto; }
.ap-new-btn:hover { filter: brightness(1.1); }

.ap-content { padding: 1.5rem; }
.access-denied { text-align: center; padding: 4rem 2rem; }
.access-denied h2 { font-size: 1.5rem; margin: 1rem 0 0.5rem; color: #121c28; }
.access-denied p { color: #444653; }

.ap-table-wrap { background-color: var(--color-white); border: 1px solid #c4c5d5; border-radius: var(--radius-xl); overflow: hidden; }
.ap-table-scroll { overflow-x: auto; }
.ap-table { width: 100%; min-width: 800px; border-collapse: collapse; }
.ap-table th { padding: 0.75rem 1.25rem; background-color: #eef4ff; border-bottom: 1px solid #c4c5d5; font-size: 0.75rem; font-weight: 600; color: #444653; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
.th-right { text-align: right; }
.ap-table td { padding: 0.625rem 1.25rem; font-size: 0.875rem; border-bottom: 1px solid rgba(196,197,213,0.3); }
.ap-row:hover td { background-color: #eef4ff; }
.td-name { font-weight: 600; color: #121c28; }
.td-muted { color: #444653; }
.td-date { color: #121c28; }
.td-empty { text-align: center; color: #757684; padding: 2rem; }
.td-actions { text-align: right; white-space: nowrap; }
.row-action { padding: 0.375rem; border: none; background: none; border-radius: 50%; color: #444653; cursor: pointer; vertical-align: middle; }
.row-action:hover { background-color: #d9e3f4; }

.role-badge { display: inline-block; padding: 0.2rem 0.625rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; }
.role-super_admin { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.role-office_manager { background-color: #eef4ff; color: #1e40af; border: 1px solid #b8c4ff; }
.role-staff { background-color: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }

.status-badge { display: inline-block; padding: 0.2rem 0.625rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; }
.status-confirmed { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.status-cancelled { background-color: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.schedule-modal { background: var(--color-white); border-radius: var(--radius-xl); width: 90vw; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-xl); }
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
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
</style>
