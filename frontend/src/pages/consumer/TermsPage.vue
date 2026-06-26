<template>
  <div class="terms-page">
    <div class="page-card">
      <span class="material-symbols-outlined page-icon">description</span>
      <h1>Terms of Service</h1>
      <p class="page-subtitle">These terms are currently being drafted and will be published here once finalized.</p>
      <div class="placeholder-section">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using the ZANECO Appointments System, you agree to comply with these terms. If you do not agree, you may not use the system.</p>
        <h2>2. Use of Service</h2>
        <p>The system is provided for scheduling and managing appointments with ZANECO offices. Unauthorized use, including attempts to disrupt service or access restricted data, is prohibited.</p>
        <h2>3. Privacy</h2>
        <p>Your use of the system is also governed by our Privacy Policy. Personal data collected through the system is handled in accordance with applicable data protection laws.</p>
        <h2>4. Changes</h2>
        <p>ZANECO reserves the right to update these terms at any time. Continued use of the system after changes constitutes acceptance of the revised terms.</p>
      </div>
      <p class="page-footer-text">Last updated: June 2026</p>
    </div>
  </div>
</template>

<style scoped>
.terms-page {
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
