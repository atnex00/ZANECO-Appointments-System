<template>
  <div class="security-page">
    <div class="page-card">
      <span class="material-symbols-outlined page-icon">shield</span>
      <h1>Security</h1>
      <p class="page-subtitle">Our security practices and compliance information will be detailed here soon.</p>
      <div class="placeholder-section">
        <h2>Data Protection</h2>
        <p>The ZANECO Appointments System uses industry-standard encryption to protect data in transit and at rest. All connections to the system are secured via HTTPS.</p>
        <h2>Access Control</h2>
        <p>Access to the admin panel is restricted to authorized personnel only. Role-based access control ensures users can only perform actions appropriate to their role.</p>
        <h2>Audit Logging</h2>
        <p>All administrative actions are logged in an immutable audit trail for compliance and security monitoring purposes.</p>
        <h2>Reporting Concerns</h2>
        <p>If you discover a security vulnerability, please contact ZANECO immediately through the official support channels.</p>
      </div>
      <p class="page-footer-text">Last updated: June 2026</p>
    </div>
  </div>
</template>

<style scoped>
.security-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem 1rem;
  background-color: var(--color-bg);
}

.page-card {
  width: 100%;
  max-width: 640px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.page-icon {
  font-size: 3rem;
  color: #d97706;
  margin-bottom: 0.5rem;
}

h1 {
  font-family: var(--font-family-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.placeholder-section {
  text-align: left;
}

.placeholder-section h2 {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 1.25rem 0 0.375rem;
}

.placeholder-section p {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.page-footer-text {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 2rem;
}
</style>
