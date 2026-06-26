import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/ConsumerLayout.vue'),
    children: [
      { path: '', name: 'home', meta: { title: 'Home' }, component: () => import('../pages/consumer/HomePage.vue') },
      { path: 'book', name: 'booking', meta: { title: 'Book Appointment' }, component: () => import('../pages/consumer/BookingFlow.vue') },
      { path: 'book/confirm', name: 'booking-confirm', meta: { title: 'Confirmation' }, component: () => import('../pages/consumer/BookingConfirmation.vue') },
      { path: 'view', name: 'view-appointment', meta: { title: 'View Appointment' }, component: () => import('../pages/consumer/ViewAppointment.vue') },
      { path: 'reschedule', name: 'reschedule', meta: { title: 'Reschedule Appointment' }, component: () => import('../pages/consumer/RescheduleAppointment.vue') },
      { path: 'cancel', name: 'cancel', meta: { title: 'Cancel Appointment' }, component: () => import('../pages/consumer/CancelAppointment.vue') },
      { path: 'terms', name: 'terms', meta: { title: 'Terms of Service' }, component: () => import('../pages/consumer/TermsPage.vue') },
      { path: 'security', name: 'security', meta: { title: 'Security' }, component: () => import('../pages/consumer/SecurityPage.vue') },
    ],
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      { path: '', redirect: '/admin/login' },
      { path: 'login', name: 'admin-login', meta: { guest: true, title: 'Admin Login' }, component: () => import('../pages/admin/LoginPage.vue') },
      { path: 'forgot-password', name: 'admin-forgot-password', meta: { guest: true, title: 'Forgot Password' }, component: () => import('../pages/admin/ForgotPasswordPage.vue') },
      { path: 'reset-password', name: 'admin-reset-password', meta: { guest: true, title: 'Reset Password' }, component: () => import('../pages/admin/ResetPasswordPage.vue') },
      { path: 'system-status', name: 'admin-system-status', meta: { title: 'System Status' }, component: () => import('../pages/admin/SystemStatusPage.vue') },
      { path: 'dashboard', name: 'admin-dashboard', meta: { auth: true, title: 'Dashboard' }, component: () => import('../pages/admin/DashboardPage.vue') },
      { path: 'appointments', name: 'admin-appointments', meta: { auth: true, title: 'Appointments' }, component: () => import('../pages/admin/AppointmentsPage.vue') },
      { path: 'appointments/:id', name: 'admin-appointment-detail', meta: { auth: true, title: 'Appointment Detail' }, component: () => import('../pages/admin/AppointmentDetail.vue') },
      { path: 'calendar', name: 'admin-calendar', meta: { auth: true, title: 'Calendar' }, component: () => import('../pages/admin/CalendarPage.vue') },
      { path: 'offices', name: 'admin-offices', meta: { auth: true, title: 'Offices', role: 'super_admin' }, component: () => import('../pages/admin/OfficesPage.vue') },
      { path: 'concern-types', name: 'admin-concern-types', meta: { auth: true, title: 'Concern Types', role: 'super_admin' }, component: () => import('../pages/admin/ConcernTypesPage.vue') },
      { path: 'reports', name: 'admin-reports', meta: { auth: true, title: 'Reports' }, component: () => import('../pages/admin/ReportsPage.vue') },
      { path: 'users', name: 'admin-users', meta: { auth: true, title: 'Admin Users', role: 'super_admin' }, component: () => import('../pages/admin/AdminUsersPage.vue') },
      { path: 'notifications', name: 'admin-notifications', meta: { auth: true, title: 'Notifications' }, component: () => import('../pages/admin/NotificationsPage.vue') },
      { path: 'audit-logs', name: 'admin-audit-logs', meta: { auth: true, title: 'Audit Logs', role: 'super_admin' }, component: () => import('../pages/admin/AuditLogsPage.vue') },
      { path: 'guide', name: 'admin-guide', meta: { auth: true, title: 'User Guide' }, component: () => import('../pages/admin/GuidePage.vue') },
      { path: 'staff', name: 'admin-staff', meta: { auth: true, title: 'Staff Dashboard' }, component: () => import('../pages/admin/StaffDashboard.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', meta: { title: 'Page Not Found' }, component: () => import('../pages/NotFound.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const TITLE_SUFFIX = ' | ZANECO Appointments'

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.meta.auth && !token) return next({ name: 'admin-login' })
  if (to.meta.guest && token) return next({ name: 'admin-dashboard' })
  if (to.meta.auth && token && to.meta.role) {
    try {
      const user = JSON.parse(localStorage.getItem('admin_user') || '{}')
      const roles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role]
      if (!roles.includes(user.role)) {
        return next({ name: 'admin-staff' })
      }
    } catch (e) {
      return next({ name: 'admin-login' })
    }
  }
  document.title = (to.meta.title || 'ZANECO') + TITLE_SUFFIX
  next()
})

export default router
