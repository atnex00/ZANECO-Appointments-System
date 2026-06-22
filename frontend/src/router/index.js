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
    ],
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      { path: '', redirect: '/admin/login' },
      { path: 'login', name: 'admin-login', meta: { guest: true, title: 'Admin Login' }, component: () => import('../pages/admin/LoginPage.vue') },
      { path: 'dashboard', name: 'admin-dashboard', meta: { auth: true, title: 'Dashboard' }, component: () => import('../pages/admin/DashboardPage.vue') },
      { path: 'appointments', name: 'admin-appointments', meta: { auth: true, title: 'Appointments' }, component: () => import('../pages/admin/AppointmentsPage.vue') },
      { path: 'appointments/:id', name: 'admin-appointment-detail', meta: { auth: true, title: 'Appointment Detail' }, component: () => import('../pages/admin/AppointmentDetail.vue') },
      { path: 'calendar', name: 'admin-calendar', meta: { auth: true, title: 'Calendar' }, component: () => import('../pages/admin/CalendarPage.vue') },
      { path: 'offices', name: 'admin-offices', meta: { auth: true, title: 'Offices' }, component: () => import('../pages/admin/OfficesPage.vue') },
      { path: 'concern-types', name: 'admin-concern-types', meta: { auth: true, title: 'Concern Types' }, component: () => import('../pages/admin/ConcernTypesPage.vue') },
      { path: 'reports', name: 'admin-reports', meta: { auth: true, title: 'Reports' }, component: () => import('../pages/admin/ReportsPage.vue') },
      { path: 'users', name: 'admin-users', meta: { auth: true, title: 'Admin Users' }, component: () => import('../pages/admin/AdminUsersPage.vue') },
      { path: 'notifications', name: 'admin-notifications', meta: { auth: true, title: 'Notifications' }, component: () => import('../pages/admin/NotificationsPage.vue') },
      { path: 'audit-logs', name: 'admin-audit-logs', meta: { auth: true, title: 'Audit Logs' }, component: () => import('../pages/admin/AuditLogsPage.vue') },
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
  document.title = (to.meta.title || 'ZANECO') + TITLE_SUFFIX
  next()
})

export default router
