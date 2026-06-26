<template>
  <div class="flex flex-col min-h-screen" style="padding-top:0">
    <!-- Hero -->
    <section class="hero-section">
      <div class="hero-bg-img"></div>
      <div class="hero-overlay"></div>
      <div class="hero-inner">
        <div class="hero-text">
          <div class="hero-badge">
            <span class="material-symbols-outlined" style="font-size:1rem">verified</span>
            <span>Official Utility Scheduling Portal</span>
          </div>
          <h1 class="hero-title">
            Expert Energy Management,<br />
            <span class="hero-highlight">Scheduled on Your Terms.</span>
          </h1>
          <p class="hero-desc">Reliable scheduling for your account and billing inquiries. Book, view, reschedule, or cancel appointments across our office network.</p>
          <div class="hero-actions">
            <router-link to="/book" class="btn btn-primary btn-lg">
              <span class="material-symbols-outlined">add_circle</span>
              Book Appointment
            </router-link>
            <router-link to="/view" class="btn btn-outline btn-lg" style="background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.4)">
              <span class="material-symbols-outlined">event_available</span>
              View Existing
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Steps -->
    <section ref="stepsEl" class="steps-section animate-section" :class="{ 'animate-visible': stepsInView }">
      <div class="steps-inner">
        <h2 class="section-title animate-child" style="transition-delay:0ms">How It Works</h2>
        <p class="section-desc animate-child" style="transition-delay:80ms">Three simple steps to get the service you need.</p>
        <div class="steps-grid">
          <div v-for="(s, i) in steps" :key="i" class="step-outer animate-child" :style="{ transitionDelay: (160 + i * 80) + 'ms' }">
            <div class="step-content">
              <div class="step-number">{{ i + 1 }}</div>
              <div class="step-icon-box" :style="{ backgroundColor: s.color + '15' }">
                <span class="material-symbols-outlined" :style="{ color: s.color }">{{ s.icon }}</span>
              </div>
              <h3 class="step-card-title">{{ s.title }}</h3>
              <p class="step-card-desc">{{ s.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Offices -->
    <section ref="officesEl" class="offices-section animate-section" :class="{ 'animate-visible': officesInView }">
      <div class="offices-inner">
        <div class="offices-header-row">
          <div>
            <h2 class="section-title animate-child" style="transition-delay:0ms">Our Office Network</h2>
            <p class="section-desc animate-child" style="transition-delay:80ms">Find your nearest service center.</p>
          </div>
        </div>
        <div class="offices-grid">
          <div v-for="(office, i) in offices" :key="office.code" class="office-card-ref animate-child" :style="{ transitionDelay: (160 + i * 80) + 'ms' }">
            <div class="office-img-wrap">
              <img v-if="office.image" :src="office.image" :alt="office.name" class="office-img" />
              <div v-else class="office-img-placeholder" :style="{ background: office.gradient }">
                <span class="material-symbols-outlined" style="font-size:2.5rem;color:rgba(255,255,255,0.4)">bolt</span>
              </div>
              <div v-if="office.badge" class="office-badge-ref">{{ office.badge }}</div>
            </div>
            <div class="office-body-ref">
              <h4>{{ office.name }}</h4>
              <p class="office-addr-ref">
                <span class="material-symbols-outlined" style="font-size:1rem">location_on</span>
                {{ office.address }}
              </p>
              <router-link to="/book" class="office-btn-ref">Book Here</router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useInView } from '../../composables/useInView.js'

const { el: stepsEl, inView: stepsInView } = useInView({ delay: 100 })
const { el: officesEl, inView: officesInView } = useInView({ delay: 100 })

const steps = [
  { icon: 'search', title: 'Select Service', desc: 'Choose the inquiry type you need assistance with from our available services.', color: '#d97706' },
  { icon: 'calendar_month', title: 'Pick Your Time', desc: 'Browse real-time availability across our office network and pick your preferred slot.', color: '#059669' },
  { icon: 'task_alt', title: 'Confirm & Visit', desc: 'Receive instant confirmation and visit us for personalized support at your scheduled time.', color: '#92400e' },
]

const offices = [
  { name: 'Main Office', code: 'MAIN', address: 'Poblacion, Dipolog City', badge: 'Main Hub', image: '/offices/ZANECO-main-office.jpg', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)' },
  { name: 'Sindangan Area Services', code: 'SAS', address: 'Sindangan, Zamboanga del Norte', badge: 'Open', gradient: 'linear-gradient(135deg, #b45309, #d97706)' },
  { name: 'Liloy Area Services', code: 'LAS', address: 'Liloy, Zamboanga del Norte', gradient: 'linear-gradient(135deg, #92400e, #b45309)' },
  { name: 'Piñan Area Services', code: 'PAS', address: 'Piñan, Zamboanga del Norte', gradient: 'linear-gradient(135deg, #78350f, #92400e)' },
  { name: 'Dipolog Area Services', code: 'DAS', address: 'Minaog, Dipolog City', gradient: 'linear-gradient(135deg, #451a03, #78350f)' },
]
</script>

<style scoped>
.hero-section {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-bg-img {
  position: absolute;
  inset: 0;
  background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(180, 83, 9, 0.75), rgba(0, 0, 0, 0.5));
}
.hero-inner {
  max-width: 720px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem 1rem;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 1rem;
  border-radius: 9999px;
  background-color: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: 600;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(4px);
}
.hero-title {
  font-size: 2.75rem;
  font-weight: 800;
  color: var(--color-white);
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}
.hero-highlight { color: #fbbf24; }
.hero-desc {
  font-size: var(--font-size-lg);
  color: rgba(255,255,255,0.85);
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 540px;
  margin-left: auto;
  margin-right: auto;
}
.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }

.steps-section {
  padding: 6rem 1rem;
  background-color: var(--color-white);
}
.steps-inner {
  max-width: 1080px;
  margin: 0 auto;
}
.section-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-gray-900);
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}
.section-desc {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  max-width: 560px;
  margin-bottom: 3rem;
}
.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
.step-outer {
  transition: transform 0.25s ease;
}
.step-outer:hover {
  transform: translateY(-4px);
}
.step-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.step-number {
  font-family: var(--font-family-heading);
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-primary-muted);
  line-height: 1;
  margin-bottom: 0.5rem;
}
.step-icon-box {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}
.step-icon-box .material-symbols-outlined { font-size: 1.75rem; }
.step-card-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
}
.step-card-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.offices-section {
  padding: 6rem 1rem;
  background-color: var(--color-gray-50);
}
.offices-inner {
  max-width: 1080px;
  margin: 0 auto;
}
.offices-header-row {
  margin-bottom: 2.5rem;
}
.offices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}
.office-card-ref {
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}
.office-card-ref:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.office-img-wrap {
  height: 160px;
  position: relative;
  overflow: hidden;
}
.office-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.office-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.office-card-ref:hover .office-img-placeholder,
.office-card-ref:hover .office-img {
  transform: scale(1.05);
  transition: transform 0.5s;
}
.office-badge-ref {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--font-size-xs);
  font-weight: 700;
}
.office-body-ref {
  padding: 1.25rem;
}
.office-body-ref h4 {
  font-size: var(--font-size-base);
  font-weight: 700;
  margin-bottom: 0.25rem;
}
.office-addr-ref {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  margin-bottom: 1rem;
}
.office-btn-ref {
  display: block;
  text-align: center;
  padding: 0.5rem;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  font-weight: 700;
  font-size: var(--font-size-sm);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all 0.15s;
}
.office-btn-ref:hover {
  background-color: var(--color-primary);
  color: var(--color-white);
}

/* Entrance Animations */
.animate-section .animate-child {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.animate-section.animate-visible .animate-child {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 768px) {
  .hero-section { min-height: 90vh; }
  .hero-title { font-size: 1.75rem; }
  .steps-grid { grid-template-columns: 1fr; }
  .step-number { font-size: 2.5rem; }
}
</style>
