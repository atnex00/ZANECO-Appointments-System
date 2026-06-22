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
          <p class="hero-desc">Reliable scheduling for your account and billing inquiries. Manage your utility appointments with enterprise-grade precision, ease, and real-time availability.</p>
          <div class="hero-actions">
            <router-link to="/book" class="btn-primary-x">
              <span class="material-symbols-outlined">add_circle</span>
              Book Appointment
            </router-link>
            <router-link to="/view" class="btn-outline-x">
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
        <h2 class="section-title animate-child" style="transition-delay:0ms">Streamlined Three-Step Process</h2>
        <p class="section-desc animate-child" style="transition-delay:80ms">Experience a frictionless journey from inquiry to resolution with our optimized digital scheduling infrastructure.</p>
        <div class="steps-grid">
          <div v-for="(s, i) in steps" :key="i" class="step-outer animate-child" :style="{ transitionDelay: (160 + i * 80) + 'ms' }">
            <div class="step-number-bg">{{ i + 1 }}</div>
            <div class="step-content">
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
            <p class="section-desc animate-child" style="transition-delay:80ms">Find the nearest service center. Our modern facilities are designed to provide you with efficient and comfortable support.</p>
          </div>
        </div>
        <div class="offices-grid">
          <div v-for="(office, i) in offices" :key="office.code" class="office-card-ref animate-child" :style="{ transitionDelay: (160 + i * 80) + 'ms' }">
            <div class="office-img-wrap">
              <img v-if="office.image" :src="office.image" :alt="office.name" class="office-card-img" />
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
  { icon: 'search', title: 'Select Service', desc: 'Choose the specific account or billing inquiry type you need assistance with from our catalog.', color: '#d97706' },
  { icon: 'calendar_month', title: 'Pick Your Time', desc: 'Browse real-time availability across our entire regional office network and secure your preferred time.', color: '#059669' },
  { icon: 'task_alt', title: 'Confirm & Visit', desc: 'Receive an instant digital confirmation and visit us for personalized support at your scheduled time.', color: '#92400e' },
]

const offices = [
  { name: 'Main Office', code: 'MAIN', address: 'Poblacion, Dipolog City', badge: 'Main Hub', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', image: '/offices/ZANECO-main-office.jpg' },
  { name: 'Sindangan Area Services', code: 'SAS', address: 'Sindangan, Zamboanga del Norte', badge: 'Open', gradient: 'linear-gradient(135deg, #b45309, #d97706)' },
  { name: 'Liloy Area Services', code: 'LAS', address: 'Liloy, Zamboanga del Norte', gradient: 'linear-gradient(135deg, #92400e, #b45309)' },
  { name: 'Piñan Area Services', code: 'PAS', address: 'Piñan, Zamboanga del Norte', gradient: 'linear-gradient(135deg, #78350f, #92400e)' },
  { name: 'Dipolog Area Services', code: 'DAS', address: 'Minaog, Dipolog City, Zamboanga del Norte', gradient: 'linear-gradient(135deg, #451a03, #78350f)' },
]
</script>

<style scoped>
.hero-section {
  position: relative;
  overflow: hidden;
  padding: 6rem 1rem;
  min-height: 600px;
  display: flex;
  align-items: center;
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
  background: linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.4));
}
.hero-inner {
  max-width: 720px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  text-align: center;
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
  color: rgba(255,255,255,0.8);
  line-height: 1.6;
  margin-bottom: 1.5rem;
  max-width: 540px;
  margin-left: auto;
  margin-right: auto;
}
.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-bottom: 2rem; }
.btn-primary-x, .btn-outline-x {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.875rem 2rem; border-radius: var(--radius-xl);
  font-weight: 700; font-size: var(--font-size-sm);
  text-decoration: none;
  transition: all 0.15s ease;
}
.btn-primary-x {
  background-color: var(--color-primary); color: var(--color-white);
  box-shadow: var(--shadow-md);
}
.btn-primary-x:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
.btn-primary-x:active {
  transform: translateY(0) scale(0.98);
}
.btn-outline-x {
  background-color: rgba(255,255,255,0.15);
  color: var(--color-white);
  border: 2px solid rgba(255,255,255,0.4);
  backdrop-filter: blur(4px);
}
.btn-outline-x:hover { background-color: rgba(255,255,255,0.25); border-color: var(--color-white); color: var(--color-white); }
.btn-outline-x:active { transform: scale(0.98); }
.hero-trust { display: flex; align-items: center; gap: 0.75rem; border-top: 1px solid var(--color-border); padding-top: 1.5rem; }
.trust-avatars { display: flex; }
.trust-avatar { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--color-white); overflow: hidden; margin-right: -8px; }
.trust-avatar img { width: 100%; height: 100%; object-fit: cover; }
.trust-text { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-gray-500); }

.hero-floating-badge {
  position: absolute;
  bottom: 1.5rem;
  right: 1.5rem;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(8px);
  padding: 1rem 1.25rem;
  border-radius: var(--radius-xl);
  max-width: 220px;
}
.live-dot { width: 10px; height: 10px; border-radius: 50%; background-color: var(--color-success); display: inline-block; }

.steps-section { padding: 4rem 1rem; background-color: var(--color-white); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
.steps-inner { max-width: 1280px; margin: 0 auto; }
.section-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-gray-900); letter-spacing: -0.02em; margin-bottom: 0.5rem; }
.section-desc { font-size: var(--font-size-base); color: var(--color-gray-500); max-width: 560px; margin-bottom: 2.5rem; }
.steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
.step-outer { position: relative; transition: transform 0.25s ease; }
.step-outer:hover { transform: translateY(-4px); }
.step-number-bg { position: absolute; top: -1rem; left: -0.25rem; font-size: 7.5rem; font-weight: 800; color: var(--color-gray-100); line-height: 1; pointer-events: none; z-index: 0; opacity: 0.6; }
.step-content { position: relative; z-index: 1; padding-top: 0.75rem; }
.step-icon-box { width: 56px; height: 56px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
.step-icon-box .material-symbols-outlined { font-size: 1.75rem; }
.step-card-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-gray-900); margin-bottom: 0.5rem; }
.step-card-desc { font-size: var(--font-size-sm); color: var(--color-gray-500); line-height: 1.6; }

.offices-section { padding: 4rem 1rem; background-color: var(--color-gray-50); }
.offices-inner { max-width: 1280px; margin: 0 auto; }
.offices-header-row { margin-bottom: 2rem; }
.offices-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
.office-card-ref { background-color: var(--color-white); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); transition: all 0.3s ease; }
.office-card-ref:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
.office-img-wrap { height: 160px; position: relative; overflow: hidden; }
.office-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
.office-card-ref:hover .office-card-img { transform: scale(1.05); }
.office-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.office-card-ref:hover .office-img-placeholder { transform: scale(1.05); transition: transform 0.5s; }
.office-badge-ref { position: absolute; top: 0.75rem; left: 0.75rem; background-color: var(--color-primary); color: var(--color-white); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: var(--font-size-xs); font-weight: 700; }
.office-body-ref { padding: 1.25rem; }
.office-body-ref h4 { font-size: var(--font-size-base); font-weight: 700; margin-bottom: 0.25rem; }
.office-addr-ref { font-size: var(--font-size-sm); color: var(--color-gray-500); display: flex; align-items: flex-start; gap: 0.25rem; margin-bottom: 1rem; }
.office-btn-ref { display: block; text-align: center; padding: 0.5rem; border: 1px solid var(--color-primary); color: var(--color-primary); font-weight: 700; font-size: var(--font-size-sm); border-radius: var(--radius-lg); text-decoration: none; transition: all 0.15s; }
.office-btn-ref:hover { background-color: var(--color-primary); color: var(--color-white); }

/* === Entrance Animations === */
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
  .hero-section { padding: 4rem 1rem; min-height: 480px; }
  .hero-title { font-size: 1.75rem; }
  .hero-floating-badge { display: none; }
  .steps-grid { grid-template-columns: 1fr; }
  .step-number-bg { font-size: 5rem; }
}
</style>
