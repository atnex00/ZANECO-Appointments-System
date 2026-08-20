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
            <img :src="theme.isDark.value ? '/logo-combined-white.png' : '/logo-combined.png'" alt="ZANECO" class="sidebar-logo-img" />
          </div>
          <h1 class="sidebar-title">Appointments System Admin Portal</h1>
          <DigitalClock />
        </div>
        <nav class="sidebar-nav">
          <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="sidebar-link" :class="{ 'sidebar-link-active': isActive(item.path) }" @click="drawerOpen = false">
            <span class="material-symbols-outlined sidebar-link-icon" :class="{ 'sidebar-link-icon-fill': isActive(item.path) }">{{ item.icon }}</span>
            <span class="sidebar-link-label">{{ item.label }}</span>
          </router-link>
        </nav>
        <div class="sidebar-footer">
          <div class="theme-toggle-row">
            <span class="theme-toggle-label">{{ theme.isDark.value ? 'Dark' : 'Light' }} Mode</span>
            <button class="theme-switch" :class="{ 'theme-switch-dark': theme.isDark.value }" @click="theme.toggle" :title="theme.isDark.value ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
              <span class="theme-switch-track">
                <span class="theme-switch-icon theme-switch-icon-sun">
                  <span class="material-symbols-outlined">light_mode</span>
                </span>
                <span class="theme-switch-icon theme-switch-icon-moon">
                  <span class="material-symbols-outlined">dark_mode</span>
                </span>
                <span class="theme-switch-thumb"></span>
              </span>
            </button>
          </div>
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
        <header class="mobile-header">
          <div class="mobile-header-logos">
            <img :src="theme.isDark.value ? '/logo-combined-white.png' : '/logo-combined.png'" alt="ZANECO" class="mobile-header-logo-img" />
          </div>
          <span class="mobile-header-title">Appointments System Admin Portal (Mobile Version)</span>
          <div class="mobile-header-right">
            <button class="theme-switch theme-switch-sm" :class="{ 'theme-switch-dark': theme.isDark.value }" @click="theme.toggle" :title="theme.isDark.value ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
              <span class="theme-switch-track">
                <span class="theme-switch-thumb"></span>
              </span>
            </button>
            <button class="mobile-header-user-btn" @click.stop="showAccountMenu = !showAccountMenu">
              <div class="mobile-header-user">{{ userInitials }}</div>
            </button>
            <div v-if="showAccountMenu" class="mobile-account-popup" @click.stop>
              <div class="mobile-account-info">
                <div class="mobile-account-avatar">{{ userInitials }}</div>
                <div>
                  <p class="mobile-account-name">{{ auth.user?.full_name || 'Admin' }}</p>
                  <p class="mobile-account-role">{{ auth.user?.role || 'Administrator' }}</p>
                </div>
              </div>
              <div class="mobile-account-divider"></div>
              <div class="mobile-theme-row">
                <span class="mobile-theme-label">{{ theme.isDark.value ? 'Dark' : 'Light' }} Mode</span>
                <button class="theme-switch theme-switch-sm" :class="{ 'theme-switch-dark': theme.isDark.value }" @click="theme.toggle" :title="theme.isDark.value ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
                  <span class="theme-switch-track">
                    <span class="theme-switch-thumb"></span>
                  </span>
                </button>
              </div>
              <div class="mobile-account-divider"></div>
              <button class="mobile-account-logout" @click="handleLogout">Logout</button>
            </div>
          </div>
          <div v-if="showAccountMenu" class="mobile-account-overlay" @click="showAccountMenu = false"></div>
        </header>
        <router-view v-slot="{ Component, route }">
          <Transition name="admin-page" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </router-view>
        <footer class="admin-footer">
          <div class="footer-inner">
            <p class="footer-copy">&copy; {{ new Date().getFullYear() }} ZANECO. System v1.0</p>
            <div class="footer-links">
              <a href="https://zaneco.ph/contact-us/" target="_blank" rel="noopener">Support Center</a>
              <router-link to="/terms">Terms of Service</router-link>
              <router-link to="/security">Security</router-link>
            </div>
          </div>
        </footer>
      </main>
      <button v-if="showFab" class="fab" :title="fabLabel" @click="$emit('fab-click')"><span class="material-symbols-outlined">add</span><span class="fab-tooltip">{{ fabLabel }}</span></button>
      <nav class="mobile-bottom-nav">
        <button class="mobile-nav-arrow" :disabled="navStart === 0" @click="navStart = Math.max(0, navStart - 1)">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <div class="mobile-nav-track">
          <router-link v-for="item in visibleNav" :key="item.path" :to="item.path" class="mobile-nav-item" :class="{ 'mobile-nav-active': isActive(item.path) }">
            <span class="material-symbols-outlined" :class="{ 'mobile-icon-fill': isActive(item.path) }">{{ item.icon }}</span>
            <span class="mobile-nav-label">{{ item.label }}</span>
          </router-link>
        </div>
        <button class="mobile-nav-arrow" :disabled="navStart + visibleCount >= mobileNav.length" @click="navStart = Math.min(mobileNav.length - visibleCount, navStart + 1)">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </nav>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, provide, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import DigitalClock from '../components/common/DigitalClock.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const theme = useTheme()
const drawerOpen = ref(false)
const showFab = ref(false)
const fabLabel = ref('')
const navStart = ref(0)
const visibleCount = ref(5)
const showAccountMenu = ref(false)

const updateCount = () => {
  const w = window.innerWidth
  if (w < 380) visibleCount.value = 4
  else visibleCount.value = 5
  if (navStart.value + visibleCount.value > mobileNav.value.length) {
    navStart.value = Math.max(0, mobileNav.value.length - visibleCount.value)
  }
}
onMounted(() => { updateCount(); window.addEventListener('resize', updateCount) })
onUnmounted(() => { window.removeEventListener('resize', updateCount) })

const visibleNav = computed(() => mobileNav.value.slice(navStart.value, navStart.value + visibleCount.value))

const isLoginPage = computed(() =>
  ['/admin/login', '/admin/forgot-password', '/admin/reset-password', '/admin/system-status'].includes(route.path)
)

provide('toggleDrawer', (val) => { drawerOpen.value = val })
provide('setFab', (show, label) => { showFab.value = show; fabLabel.value = label })

function handleLogout() {
  auth.logout()
  router.push('/admin/login')
}

const staffNavItem = { path: '/admin/staff', label: 'Staff Dashboard', icon: 'fact_check' }

const allNavItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/admin/appointments', label: 'Appointments', icon: 'event_available' },
  { path: '/admin/offices', label: 'Offices', icon: 'domain' },
  { path: '/admin/calendar', label: 'Schedules', icon: 'calendar_month' },
  { path: '/admin/concern-types', label: 'Concerns', icon: 'report_problem' },
  { path: '/admin/notifications', label: 'Notifications', icon: 'notifications' },
  { path: '/admin/users', label: 'User Management', icon: 'admin_panel_settings' },
  { path: '/admin/reports', label: 'Reports', icon: 'assessment' },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: 'shield' },
  { path: '/admin/guide', label: 'User Guide', icon: 'book' },
  { path: '/admin/system-status', label: 'System Status', icon: 'monitor_heart' },
]

const staffAllowed = ['/admin/staff', '/admin/reports', '/admin/audit-logs', '/admin/guide']

const navItems = computed(() => {
  const items = [...allNavItems]
  items.unshift(staffNavItem)
  if (auth.user?.role === 'staff') return items.filter(i => staffAllowed.includes(i.path))
  return items
})

const mobileNav = computed(() => {
  const items = [
    { path: '/admin/dashboard', label: 'Home', icon: 'home' },
    { path: '/admin/appointments', label: 'Appointments', icon: 'event_available' },
    { path: '/admin/offices', label: 'Offices', icon: 'domain' },
    { path: '/admin/calendar', label: 'Schedules', icon: 'calendar_month' },
    { path: '/admin/concern-types', label: 'Concerns', icon: 'report_problem' },
    { path: '/admin/notifications', label: 'Notifs', icon: 'notifications' },
    { path: '/admin/users', label: 'Users', icon: 'admin_panel_settings' },
    { path: '/admin/reports', label: 'Reports', icon: 'assessment' },
    { path: '/admin/audit-logs', label: 'Audits', icon: 'shield' },
    { path: '/admin/guide', label: 'Guide', icon: 'book' },
  ]
  items.unshift({ path: '/admin/staff', label: 'Staff', icon: 'fact_check' })
  if (auth.user?.role === 'staff') return items.filter(i => staffAllowed.includes(i.path))
  return items
})

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
  background-color: var(--color-primary-light);
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
  background-color: var(--color-sidebar-bg);
  border-right: 1px solid var(--color-sidebar-border);
  transition: background-color 0.35s ease, border-color 0.35s ease, transform 0.3s ease;
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
  font-family: var(--font-family);
}

.sidebar-nav {
  flex: 1;
  padding: 0.25rem 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem 0.625rem 1.25rem;
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  color: var(--color-sidebar-text);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.15s;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  border-left: 4px solid transparent;
}
.sidebar-link:hover { background-color: var(--color-sidebar-hover); }
.sidebar-link-active {
  background-color: var(--color-sidebar-active-bg) !important;
  border-left-color: var(--color-primary) !important;
  color: var(--color-sidebar-text-active) !important;
  font-weight: 700;
}
.sidebar-link-icon { font-size: 1.25rem; }
.sidebar-link-icon-fill { font-variation-settings: 'FILL' 1; }
.sidebar-link-label { font-size: 0.875rem; }

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-sidebar-footer-border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Theme Toggle Switch */
.theme-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.theme-toggle-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-sidebar-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.theme-switch {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}
.theme-switch-track {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 64px;
  height: 32px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  padding: 0 4px;
  transition: background 0.4s ease;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.15);
}
.theme-switch-dark .theme-switch-track {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}
.theme-switch-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  z-index: 1;
  transition: opacity 0.3s ease;
}
.theme-switch-icon .material-symbols-outlined {
  font-size: 1rem;
  color: #fff;
  font-variation-settings: 'FILL' 1;
}
.theme-switch-icon-sun { opacity: 1; }
.theme-switch-icon-moon { opacity: 0.3; }
.theme-switch-dark .theme-switch-icon-sun { opacity: 0.3; }
.theme-switch-dark .theme-switch-icon-moon { opacity: 1; }
.theme-switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.theme-switch-dark .theme-switch-thumb {
  transform: translateX(32px);
}

/* Small variant for mobile */
.theme-switch-sm .theme-switch-track {
  width: 48px;
  height: 26px;
}
.theme-switch-sm .theme-switch-thumb {
  width: 20px;
  height: 20px;
  top: 3px;
  left: 3px;
}
.theme-switch-dark.theme-switch-sm .theme-switch-thumb {
  transform: translateX(22px);
}

.mobile-theme-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}
.mobile-theme-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-700);
}

.logout-btn {
  width: 100%;
  margin-top: 0;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-sidebar-border);
  border-radius: 9999px;
  background: none;
  color: var(--color-sidebar-text);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.logout-btn:hover { background-color: var(--color-sidebar-hover); color: #dc2626; }
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.sidebar-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-primary-muted);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}
.sidebar-user-name { font-size: 0.875rem; font-weight: 600; color: var(--color-gray-900); }
.sidebar-user-role { font-size: 0.75rem; color: var(--color-gray-600); }

/* Page transitions */
.admin-page-enter-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.admin-page-leave-active {
  transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
.admin-page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.admin-page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Main */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100vh;
  padding-bottom: 4.5rem;
}
@media (max-width: 1023px) { .admin-main { padding-top: 0; } }
@media (min-width: 1024px) { .admin-main { padding-bottom: 0; } }

/* Footer */
.admin-footer {
  margin-top: auto;
  background-color: var(--color-footer-bg);
  border-top: 1px solid var(--color-footer-border);
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
.footer-copy { font-size: 0.75rem; color: var(--color-gray-600); }
.footer-links { display: flex; gap: 1rem; }
.footer-links a { font-size: 0.75rem; color: var(--color-gray-600); text-decoration: none; }
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
  background-color: var(--color-gray-800);
  color: var(--color-primary-light);
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

/* Mobile Header */
.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: var(--color-mobile-header-bg);
  border-bottom: 1px solid var(--color-mobile-header-border);
}
@media (max-width: 1023px) {
  .mobile-header { display: flex; }
  .mobile-overlay { display: none; }
  .admin-sidebar { display: none; }
}
.mobile-header-logos {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.mobile-header-logo-img {
  height: 1.75rem;
  width: auto;
}
.mobile-header-title {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 0.5rem;
}
.mobile-header-right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.mobile-header-user-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
}
.mobile-header-user {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: 700;
  pointer-events: none;
}
.mobile-account-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0,0,0,0.3);
}
.mobile-account-popup {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 70;
  min-width: 220px;
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  border: 1px solid var(--color-border);
  padding: 1rem;
}
.mobile-account-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.mobile-account-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 700;
  flex-shrink: 0;
}
.mobile-account-name {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-gray-900);
}
.mobile-account-role {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  margin-top: 0.125rem;
}
.mobile-account-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.75rem 0;
}
.mobile-account-logout {
  width: 100%;
  padding: 0.625rem 0;
  border: none;
  background: none;
  border-radius: var(--radius-lg);
  color: var(--color-danger);
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
  text-align: center;
  transition: background 0.15s;
}
.mobile-account-logout:hover {
  background-color: #fef2f2;
}
@media (min-width: 1024px) {
  .mobile-account-popup,
  .mobile-account-overlay { display: none; }
}

/* Mobile Bottom Nav */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0.375rem 0.25rem;
  background-color: var(--color-primary-light);
  border-top: 1px solid var(--color-mobile-nav-border);
  box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
}
@media (min-width: 1024px) { .mobile-bottom-nav { display: none; } }

.mobile-nav-track {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 0.125rem;
}

.mobile-nav-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  border-radius: 50%;
  color: var(--color-gray-600);
  cursor: pointer;
  transition: background 0.15s;
}
.mobile-nav-arrow:hover { background-color: var(--color-nav-hover); }
.mobile-nav-arrow:disabled { opacity: 0.2; cursor: default; }
.mobile-nav-arrow:disabled:hover { background: none; }
.mobile-nav-arrow .material-symbols-outlined { font-size: 1.25rem; }

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--color-gray-600);
  text-decoration: none;
  padding: 0.25rem 0.25rem;
  border-radius: 9999px;
  transition: background 0.15s;
  max-width: 4.5rem;
}
.mobile-nav-item:active { background-color: var(--color-nav-hover); }
.mobile-nav-active { color: var(--color-primary); }
.mobile-nav-item .material-symbols-outlined { font-size: 1.375rem; }
.mobile-icon-fill { font-variation-settings: 'FILL' 1; }
.mobile-nav-label { font-size: 0.65rem; font-weight: 600; margin-top: 0.125rem; white-space: nowrap; }
</style>
