<template>
  <template v-if="isLoginPage">
    <router-view />
  </template>
  <template v-else>
    <div class="admin-shell">
      <div v-if="drawerOpen" class="mobile-overlay" @click="drawerOpen = false"></div>
      <aside class="admin-sidebar" :class="{ 'sidebar-open': drawerOpen }">
        <div class="sidebar-header">
          <div class="sidebar-logos">
            <img src="/ZANECO_Logo.png" alt="ZANECO" class="sidebar-logo-img" />
            <img src="https://i.imgur.com/SacrqEj.png" alt="DPC" class="sidebar-logo-img" />
          </div>
          <h1 class="sidebar-title">Appointments System Admin Portal</h1>
        </div>
        <nav class="sidebar-nav">
          <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="sidebar-link" :class="{ 'sidebar-link-active': isActive(item.path) }" @click="drawerOpen = false">
            <span class="material-symbols-outlined sidebar-link-icon" :class="{ 'sidebar-link-icon-fill': isActive(item.path) }">{{ item.icon }}</span>
            <span class="sidebar-link-label">{{ item.label }}</span>
          </router-link>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-avatar">{{ userInitials }}</div>
            <div>
              <p class="sidebar-user-name">{{ auth.user?.full_name || 'Admin' }}</p>
              <p class="sidebar-user-role">{{ auth.user?.role || 'Administrator' }}</p>
            </div>
          </div>
          <button class="logout-btn" @click="handleLogout">Logout</button>
        </div>
      </aside>
      <main class="admin-main">
        <router-view />
        <footer class="admin-footer">
          <div class="footer-inner">
            <p class="footer-copy">&copy; {{ new Date().getFullYear() }} ZANECO. System v1.0</p>
            <div class="footer-links">
              <a href="#">Support Center</a>
              <a href="#">Terms of Service</a>
              <a href="#">Security</a>
            </div>
          </div>
        </footer>
      </main>
      <button v-if="showFab" class="fab" :title="fabLabel" @click="$emit('fab-click')"><span class="material-symbols-outlined">add</span><span class="fab-tooltip">{{ fabLabel }}</span></button>
      <nav class="mobile-bottom-nav">
        <router-link v-for="item in mobileNav" :key="item.path" :to="item.path" class="mobile-nav-item" :class="{ 'mobile-nav-active': isActive(item.path) }">
          <span class="material-symbols-outlined" :class="{ 'mobile-icon-fill': isActive(item.path) }">{{ item.icon }}</span>
          <span class="mobile-nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const drawerOpen = ref(false)
const showFab = ref(false)
const fabLabel = ref('')

const isLoginPage = computed(() => route.path === '/admin/login')

provide('toggleDrawer', (val) => { drawerOpen.value = val })
provide('setFab', (show, label) => { showFab.value = show; fabLabel.value = label })

function handleLogout() {
  auth.logout()
  router.push('/admin/login')
}

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/admin/appointments', label: 'Appointments', icon: 'event_available' },
  { path: '/admin/offices', label: 'Offices', icon: 'domain' },
  { path: '/admin/calendar', label: 'Schedules', icon: 'calendar_month' },
  { path: '/admin/concern-types', label: 'Concerns', icon: 'report_problem' },
  { path: '/admin/notifications', label: 'Notifications', icon: 'notifications' },
  { path: '/admin/users', label: 'Admin Users', icon: 'admin_panel_settings' },
  { path: '/admin/reports', label: 'Reports', icon: 'assessment' },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: 'shield' },
]

const mobileNav = [
  { path: '/admin/dashboard', label: 'Home', icon: 'home' },
  { path: '/admin/appointments', label: 'Appointments', icon: 'event_available' },
  { path: '/admin/offices', label: 'Offices', icon: 'domain' },
  { path: '/admin/reports', label: 'Reports', icon: 'assessment' },
]

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

const userInitials = computed(() => {
  const name = auth.user?.full_name || 'Admin'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})
</script>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background-color: #f8f9ff;
}

/* Mobile overlay */
.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 30;
}
@media (min-width: 1024px) { .mobile-overlay { display: none; } }

/* Sidebar */
.admin-sidebar {
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 40;
  height: 100vh;
  width: 260px;
  background-color: #eef4ff;
  border-right: 1px solid #c4c5d5;
  transition: transform 0.3s ease;
  transform: translateX(-100%);
}
@media (min-width: 1024px) {
  .admin-sidebar { position: sticky; transform: translateX(0); }
}
.sidebar-open { transform: translateX(0); }

.sidebar-header {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.sidebar-logos {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sidebar-logo-img { height: 2.25rem; width: auto; }
.sidebar-title {
  font-size: 0.813rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 0.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 9999px;
  color: #444653;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.15s;
}
.sidebar-link:hover { background-color: #dfe9fa; }
.sidebar-link-active {
  background-color: #6cf8bb !important;
  color: #005236 !important;
  font-weight: 700;
}
.sidebar-link-icon { font-size: 1.25rem; }
.sidebar-link-icon-fill { font-variation-settings: 'FILL' 1; }
.sidebar-link-label { font-size: 0.875rem; }

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #c4c5d5;
}
.logout-btn {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid #c4c5d5;
  border-radius: 9999px;
  background: none;
  color: #444653;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.logout-btn:hover { background-color: #dfe9fa; color: #dc2626; }
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.sidebar-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #dde1ff;
  color: #001453;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}
.sidebar-user-name { font-size: 0.875rem; font-weight: 600; color: #121c28; }
.sidebar-user-role { font-size: 0.75rem; color: #444653; }

/* Main */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100vh;
}

/* Footer */
.admin-footer {
  margin-top: auto;
  background-color: #d9e3f4;
  border-top: 1px solid rgba(196, 197, 213, 0.3);
  padding: 1rem 1.5rem;
}
.footer-inner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  text-align: center;
}
@media (min-width: 768px) {
  .footer-inner { flex-direction: row; justify-content: space-between; }
}
.footer-copy { font-size: 0.75rem; color: #444653; }
.footer-links { display: flex; gap: 1rem; }
.footer-links a { font-size: 0.75rem; color: #444653; text-decoration: none; }
.footer-links a:hover { color: var(--color-primary); }

/* FAB */
.fab {
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 50;
  transition: all 0.15s;
}
.fab:hover { transform: translateY(-4px); box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
.fab .material-symbols-outlined { font-size: 1.75rem; }
.fab-tooltip {
  position: absolute;
  right: calc(100% + 1rem);
  background-color: #27313e;
  color: #eaf1ff;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}
.fab:hover .fab-tooltip { opacity: 1; }
@media (max-width: 768px) { .fab { bottom: 5rem; right: 1rem; width: 56px; height: 56px; } }

/* Mobile Bottom Nav */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 50;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f8f9ff;
  border-top: 1px solid rgba(196,197,213,0.1);
  box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
}
@media (min-width: 1024px) { .mobile-bottom-nav { display: none; } }

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #444653;
  text-decoration: none;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  transition: background 0.15s;
}
.mobile-nav-item:active { background-color: #dfe9fa; }
.mobile-nav-active { color: var(--color-primary); }
.mobile-nav-item .material-symbols-outlined { font-size: 1.5rem; }
.mobile-icon-fill { font-variation-settings: 'FILL' 1; }
.mobile-nav-label { font-size: 0.75rem; font-weight: 600; margin-top: 0.125rem; }
</style>
