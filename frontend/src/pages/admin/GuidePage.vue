<template>
  <div class="guide-page">
    <div class="page-header">
      <h1>User Guide</h1>
    </div>
    <div class="guide-layout">
      <aside class="guide-toc">
        <h3 class="toc-title">Contents</h3>
        <nav class="toc-nav">
          <a v-for="item in tocItems" :key="item.id" :href="'#' + item.id" class="toc-link" :class="{ active: activeSection === item.id }" @click.prevent="scrollTo(item.id)">{{ item.label }}</a>
        </nav>
      </aside>

      <div class="guide-content">
      <!-- 1. Overview -->
      <section ref="overviewRef" id="overview" class="guide-section">
        <h2 class="guide-h2">Overview &amp; Getting Started</h2>
        <p class="guide-p">The <strong>ZANECO Appointments System</strong> is a web-based platform that allows ZANECO customer service offices to manage consumer appointments digitally. This guide covers the complete Admin Panel, where authorized staff can oversee appointments, offices, schedules, users, and reports.</p>

        <h3 class="guide-h3">Logging In</h3>
        <p class="guide-p">Navigate to <code class="guide-code">/admin/login</code>. Enter your registered email address and password. If you are a new administrator, your system administrator will provide your credentials. After logging in, you will be redirected to the Dashboard.</p>

        <h3 class="guide-h3">Navigating the Admin Panel</h3>
        <p class="guide-p">The sidebar on the left gives you access to all management modules. On mobile devices, the sidebar collapses into a bottom navigation bar. The header section shows your name and role, along with a logout button.</p>

        <div class="guide-tip">
          <span class="material-symbols-outlined" style="font-size:1.25rem">lightbulb</span>
          <span>Bookmark this User Guide for quick reference while using the system.</span>
        </div>
      </section>

      <!-- 2. Appointments -->
      <section ref="appointmentsRef" id="appointments" class="guide-section">
        <h2 class="guide-h2">Managing Appointments</h2>
        <p class="guide-p">The Appointments page is the central hub for viewing and managing all consumer appointments. Access it from the sidebar under <strong>Appointments</strong>.</p>

        <h3 class="guide-h3">Appointments List</h3>
        <p class="guide-p">The list displays each appointment with its reference number, consumer name, office, date, time, and current status. Use the <strong>Filters</strong> button to narrow down results by status, date range, office, or concern type. The search box lets you find appointments by reference number or consumer name.</p>

        <h3 class="guide-h3">Appointment Statuses</h3>
        <div class="guide-table-wrap">
          <table class="guide-table">
            <thead><tr><th>Status</th><th>Description</th><th>Actions Available</th></tr></thead>
            <tbody>
              <tr><td><span class="status-badge status-pending">Pending</span></td><td>Newly created, awaiting confirmation</td><td>Confirm, Cancel, Reschedule</td></tr>
              <tr><td><span class="status-badge status-confirmed">Confirmed</span></td><td>Approved by admin</td><td>Complete, Cancel, No Show, Reschedule</td></tr>
              <tr><td><span class="status-badge status-rescheduled">Rescheduled</span></td><td>Appointment date/time changed</td><td>Confirm, Cancel, Reschedule, No Show</td></tr>
              <tr><td><span class="status-badge status-completed">Completed</span></td><td>Consumer visited and was served</td><td>Archive, Reopen</td></tr>
              <tr><td><span class="status-badge status-cancelled">Cancelled</span></td><td>Appointment was cancelled</td><td>Archive, Reopen</td></tr>
              <tr><td><span class="status-badge status-noshow">No Show</span></td><td>Consumer did not arrive</td><td>Archive, Reopen</td></tr>
              <tr><td><span class="status-badge status-archived">Archived</span></td><td>Moved to archive</td><td>Reopen</td></tr>
            </tbody>
          </table>
        </div>

        <h3 class="guide-h3">Quick Actions</h3>
        <p class="guide-p">In the list view, each row has action icons for quick status updates: <strong>Confirm</strong> (green check), <strong>Complete</strong> (green checkmark), <strong>Cancel</strong> (red X), <strong>Reschedule</strong> (calendar, blue), <strong>Archive</strong> (box), and <strong>Delete</strong> (trash — super admin only). Hover over each icon to see its tooltip. The Reschedule button opens a modal where you can pick a new date and available time slot.</p>

        <h3 class="guide-h3">Appointment Detail View</h3>
        <p class="guide-p">Click on any appointment row or the visibility icon to open the detail view. Here you can see the complete consumer information, appointment details, a full set of action buttons, notification history, and the audit trail for that specific appointment.</p>

        <div class="guide-warning">
          <span class="material-symbols-outlined" style="font-size:1.25rem">warning</span>
          <span>Deleting an appointment is permanent and cannot be undone. Only Super Admins have this ability.</span>
        </div>
      </section>

      <!-- 3. Offices & Concerns -->
      <section ref="officesRef" id="offices" class="guide-section">
        <h2 class="guide-h2">Offices &amp; Concern Types</h2>
        <p class="guide-p">Manage the office network and the types of concerns consumers can select when booking.</p>

        <h3 class="guide-h3">Offices</h3>
        <p class="guide-p">The <strong>Offices</strong> page (sidebar <strong>Offices</strong>) lists all registered ZANECO offices. Each office has a name, address, and assigned schedule. You can add a new office by clicking the <strong>Add Office</strong> button, or edit an existing one inline. Each office can be enabled or disabled — disabled offices will not appear in the consumer booking flow.</p>

        <h3 class="guide-h3">Concern Types</h3>
        <p class="guide-p">The <strong>Concerns</strong> page (sidebar <strong>Concerns</strong>) lists all service categories, such as "Billing Inquiry" or "New Connection". These are the options consumers see when booking. Like offices, you can add, edit, or enable/disable concern types.</p>

        <div class="guide-tip">
          <span class="material-symbols-outlined" style="font-size:1.25rem">lightbulb</span>
          <span>Keep concern types clear and specific. This helps consumers select the right category and helps your staff prepare in advance.</span>
        </div>
      </section>

      <!-- 4. Schedules -->
      <section ref="schedulesRef" id="schedules" class="guide-section">
        <h2 class="guide-h2">Schedules &amp; Calendar</h2>
        <p class="guide-p">The <strong>Schedules</strong> page provides a monthly calendar view of all appointments across your offices. Access it from the sidebar under <strong>Schedules</strong>.</p>

        <h3 class="guide-h3">Calendar Overview</h3>
        <p class="guide-p">The calendar displays appointments for each day. Days with appointments show them grouped by status. Navigate between months using the left and right arrow buttons at the top of the calendar.</p>

        <h3 class="guide-h3">Managing Time Slots</h3>
        <p class="guide-p">Each office has configurable time slots that determine when consumers can book. Slots are managed per office and can be customized for each day of the week. The system automatically prevents double-booking within the same time slot.</p>

        <h3 class="guide-h3">Office Hours</h3>
        <p class="guide-p">Each office has defined operating hours (e.g., 8:00 AM - 5:00 PM). Slots outside these hours are not available for booking. Holidays and office closures can be managed to block specific dates.</p>
      </section>

      <!-- 5. Reports -->
      <section ref="reportsRef" id="reports" class="guide-section">
        <h2 class="guide-h2">Reports &amp; Analytics</h2>
        <p class="guide-p">The Dashboard and Reports modules provide insights into appointment data and system performance.</p>

        <h3 class="guide-h3">Dashboard</h3>
        <p class="guide-p">The <strong>Dashboard</strong> shows a summary of key metrics: total appointments today, this week, and this month; counts by status (pending, confirmed, completed, cancelled, no-show); the busiest office today; peak booking hour; and a weekly trend chart. All numbers update in real time as appointments are processed.</p>

        <h3 class="guide-h3">Reports Page</h3>
        <p class="guide-p">The <strong>Reports</strong> page offers more detailed analytics. You can filter by date range, office, and status. Data is presented in both table and chart formats, and can be exported as a PDF for sharing with management or for record-keeping.</p>

        <div class="guide-tip">
          <span class="material-symbols-outlined" style="font-size:1.25rem">lightbulb</span>
          <span>Use reports to identify peak booking times and popular offices — this helps with staffing decisions.</span>
        </div>
      </section>

      <!-- 6. Admin Users -->
      <section ref="usersRef" id="users" class="guide-section">
        <h2 class="guide-h2">Admin Users &amp; Permissions</h2>
        <p class="guide-p">The <strong>Admin Users</strong> page (sidebar <strong>Admin Users</strong>) is where you manage who has access to the admin panel. This section is only available to Super Administrators.</p>

        <h3 class="guide-h3">User Roles</h3>
        <div class="guide-table-wrap">
          <table class="guide-table">
            <thead><tr><th>Role</th><th>Permissions</th></tr></thead>
            <tbody>
              <tr><td><strong>Super Admin</strong></td><td>Full access — can manage admin users, offices, concerns, all appointments, reports, and system settings</td></tr>
              <tr><td><strong>Admin</strong></td><td>Can manage appointments, offices, concerns, schedules, and reports. Cannot create or delete other admin users.</td></tr>
            </tbody>
          </table>
        </div>

        <h3 class="guide-h3">Managing Users</h3>
        <p class="guide-p">From the Admin Users page, you can <strong>Add</strong> a new admin (enter name, email, password, and select role), <strong>Edit</strong> an existing user's details or role, and <strong>Activate/Deactivate</strong> a user. Deactivated users cannot log into the admin panel but their data is preserved.</p>

        <div class="guide-warning">
          <span class="material-symbols-outlined" style="font-size:1.25rem">warning</span>
          <span>Deactivate rather than delete whenever possible. This preserves the audit trail and prevents data loss.</span>
        </div>
      </section>

      <!-- 7. Notifications & Audit Logs -->
      <section ref="notificationsRef" id="notifications" class="guide-section">
        <h2 class="guide-h2">Notifications &amp; Audit Logs</h2>

        <h3 class="guide-h3">Notifications</h3>
        <p class="guide-p">The <strong>Notifications</strong> page shows all SMS and email notifications sent to consumers. Each entry shows the recipient, channel (SMS or Email), status (Sent, Failed, Pending), and timestamps. Failed notifications can be retried by clicking the refresh icon.</p>

        <h3 class="guide-h3">Audit Logs</h3>
        <p class="guide-p">The <strong>Audit Logs</strong> page provides a complete trail of all actions performed in the system. Each log entry records: timestamp, admin name, action type (e.g., APPOINTMENT_CONFIRMED, OFFICE_UPDATED), entity type, entity ID, and IP address. Filter logs by action type or date range.</p>

        <div class="guide-tip">
          <span class="material-symbols-outlined" style="font-size:1.25rem">lightbulb</span>
          <span>Audit logs are read-only and cannot be deleted. They serve as an immutable record for compliance and troubleshooting.</span>
        </div>
      </section>

      <!-- 8. Staff Dashboard -->
      <section ref="staffDashboardRef" id="staff-dashboard" class="guide-section">
        <h2 class="guide-h2">Staff Dashboard</h2>
        <p class="guide-p">The <strong>Staff Dashboard</strong> is a mobile-friendly daily queue page for front-desk staff. It shows all of today's appointments for your office and lets you manage them through their lifecycle. Access it from the sidebar under <strong>Staff Dashboard</strong>.</p>

        <h3 class="guide-h3">Today's Queue</h3>
        <p class="guide-p">When you open the Staff Dashboard, you'll see all appointments scheduled for today at your office, sorted by time. Each card shows the consumer name, concern type, time slot, and current status. Use the <strong>date picker</strong> and <strong>arrow buttons</strong> to browse other dates, or click <strong>Upcoming</strong> to see all future appointments grouped by date. Click <strong>Back to Today</strong> to return to the current day.</p>

        <h3 class="guide-h3">Tabs</h3>
        <p class="guide-p">Use the tabs at the top to filter the queue: <strong>All</strong> (everyone), <strong>Waiting</strong> (pending and confirmed arrivals), <strong>Completed</strong> (finished appointments), and <strong>No Show</strong> (consumers who didn't arrive).</p>

        <h3 class="guide-h3">Check-in Flow</h3>
        <p class="guide-p">Tap an appointment card to expand it and see full details (reference number, account number, mobile number, email). From the expanded view, you can take the following actions:</p>
        <ul class="guide-ul">
          <li><strong>Mark Arrived</strong> &mdash; Confirms the consumer's arrival. Changes status from pending to confirmed.</li>
          <li><strong>Complete Service</strong> &mdash; Opens a modal to add service notes about what was done, then marks the appointment as completed.</li>
          <li><strong>Reschedule</strong> &mdash; Change the appointment to a different date and time with a reason note.</li>
          <li><strong>Cancel</strong> &mdash; Cancel the appointment with a cancellation reason.</li>
          <li><strong>No Show</strong> &mdash; Mark the appointment as no-show if the consumer did not arrive.</li>
          <li><strong>Reopen</strong> &mdash; Reopen a completed, cancelled, or no-show appointment back to pending.</li>
          <li><strong>Archive</strong> &mdash; Move a terminal appointment (completed, cancelled, no-show) to the archive.</li>
        </ul>

        <div class="guide-tip">
          <span class="material-symbols-outlined" style="font-size:1.25rem">lightbulb</span>
          <span>Use the <strong>Upcoming</strong> button to see all future appointments in one view. You can also navigate to any specific date using the date picker or the left/right arrows.</span>
        </div>
      </section>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const tocItems = [
  { id: 'overview', label: 'Overview & Getting Started' },
  { id: 'appointments', label: 'Managing Appointments' },
  { id: 'offices', label: 'Offices & Concern Types' },
  { id: 'schedules', label: 'Schedules & Calendar' },
  { id: 'reports', label: 'Reports & Analytics' },
  { id: 'users', label: 'Admin Users & Permissions' },
  { id: 'notifications', label: 'Notifications & Audit Logs' },
  { id: 'staff-dashboard', label: 'Staff Dashboard' },
]

const overviewRef = ref(null)
const appointmentsRef = ref(null)
const officesRef = ref(null)
const schedulesRef = ref(null)
const reportsRef = ref(null)
const usersRef = ref(null)
const notificationsRef = ref(null)
const staffDashboardRef = ref(null)

const activeSection = ref('overview')
let observer = null

onMounted(() => {
  const sections = document.querySelectorAll('.guide-section')
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      }
    },
    { rootMargin: '-80px 0px -60% 0px' }
  )
  sections.forEach((el) => observer.observe(el))
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 90
    window.scrollTo({ top, behavior: 'smooth' })
  }
}
</script>

<style scoped>
.guide-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  margin: 1.5rem;
}

.page-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-gray-900);
}

.guide-layout {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  flex: 1;
}

.guide-toc {
  position: sticky;
  top: 2rem;
  align-self: flex-start;
  width: 220px;
  flex-shrink: 0;
}

.toc-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toc-link {
  display: block;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-500);
  text-decoration: none;
  transition: all 0.15s;
  border-left: 3px solid transparent;
}

.toc-link:hover {
  color: var(--color-gray-800);
  background-color: var(--color-gray-50);
}

.toc-link.active {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
  border-left-color: var(--color-primary);
  font-weight: 600;
}

.guide-content {
  flex: 1;
  min-width: 0;
}

.guide-section {
  margin-bottom: 3rem;
  scroll-margin-top: 6rem;
}

.guide-h2 {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-gray-900);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-border);
}

.guide-h3 {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-gray-800);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.guide-p {
  font-size: var(--font-size-base);
  color: var(--color-gray-600);
  line-height: 1.7;
  margin-bottom: 1rem;
}

.guide-code {
  background-color: var(--color-gray-100);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm);
  font-size: 0.875em;
  color: var(--color-primary);
  font-family: monospace;
}
.guide-ul {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}
.guide-ul li {
  font-size: var(--font-size-base);
  color: var(--color-gray-600);
  line-height: 1.7;
  margin-bottom: 0.25rem;
}

.guide-table-wrap {
  overflow-x: auto;
  margin-bottom: 1rem;
}

.guide-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.guide-table th {
  text-align: left;
  padding: 0.625rem 0.75rem;
  background-color: var(--color-gray-50);
  color: var(--color-gray-700);
  font-weight: 600;
  border-bottom: 2px solid var(--color-border);
}

.guide-table td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-gray-600);
}

.guide-table tr:hover td {
  background-color: var(--color-gray-50);
}

.guide-tip,
.guide-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.guide-tip {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.guide-warning {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.status-pending { background-color: #fef3c7; color: #92400e; }
.status-confirmed { background-color: #dbeafe; color: #1e40af; }
.status-rescheduled { background-color: #f3e8ff; color: #6b21a8; }
.status-completed { background-color: #d1fae5; color: #065f46; }
.status-cancelled { background-color: #fee2e2; color: #991b1b; }
.status-noshow { background-color: #f3f4f6; color: #4b5563; }
.status-archived { background-color: #f3f4f6; color: #6b7280; }

@media (max-width: 768px) {
  .guide-toc { display: none; }
  .guide-layout { flex-direction: column; padding: 1rem; }
  .guide-page { margin: 0.75rem; }
  .page-header { padding: 1rem 1.25rem; }
  .page-header h1 { font-size: var(--font-size-xl); }
}
</style>
