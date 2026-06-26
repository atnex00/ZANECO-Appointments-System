<template>
  <div class="consumer-layout">
    <header class="consumer-header" :class="{ scrolled }">
      <div class="header-inner">
        <router-link to="/" class="logo">
          <img src="/ZANECO_Logo.png" alt="ZANECO" class="logo-img" />
          <img src="https://i.imgur.com/SacrqEj.png" alt="DPC" class="logo-img" />
        </router-link>
        <nav class="header-nav">
          <router-link to="/book" class="nav-link">Book</router-link>
          <router-link to="/view" class="nav-link">View</router-link>
          <router-link to="/reschedule" class="nav-link">Reschedule</router-link>
          <router-link to="/cancel" class="nav-link">Cancel</router-link>
        </nav>
      </div>
    </header>
    <main class="consumer-main">
      <router-view v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </router-view>
    </main>
    <footer class="consumer-footer">
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <img src="/ZANECO_Logo.png" alt="ZANECO" class="footer-logo" />
            <img src="https://i.imgur.com/SacrqEj.png" alt="DPC" class="footer-logo" />
            <span class="text-sm text-muted">Zamboanga del Norte Electric Cooperative</span>
          </div>
          <div class="footer-contact">
            <div class="contact-item">
              <span class="material-symbols-outlined contact-icon">call</span>
              <span>(065) 908-1234</span>
            </div>
            <div class="contact-item">
              <span class="material-symbols-outlined contact-icon">mail</span>
              <span>support@zaneco.ph</span>
            </div>
            <div class="contact-item">
              <span class="material-symbols-outlined contact-icon">location_on</span>
              <span>Minaog, Dipolog City</span>
            </div>
          </div>
          <div class="footer-links">
            <a href="https://zaneco.ph/company-profile/" target="_blank" rel="noopener">About Us</a>
            <a href="https://zaneco.ph/contact-us/" target="_blank" rel="noopener">Contact Center</a>
            <a href="https://www.facebook.com/p/Zaneco-Inc-61551218819204/" target="_blank" rel="noopener">Service Updates</a>
            <router-link to="/terms">Terms of Service</router-link>
            <router-link to="/security">Security</router-link>
          </div>
        </div>
        <div class="footer-divider"></div>
        <p class="text-xs text-muted">&copy; {{ new Date().getFullYear() }} ZANECO. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const scrolled = ref(false)
let handler
onMounted(() => {
  handler = () => { scrolled.value = window.scrollY > 50 }
  window.addEventListener('scroll', handler)
})
onUnmounted(() => window.removeEventListener('scroll', handler))
</script>

<style scoped>
.consumer-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.consumer-header {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 50;
  padding: 1rem 1.5rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 2px solid var(--color-primary);
}
.consumer-header.scrolled {
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 2px 12px rgba(180, 83, 9, 0.1);
  padding: 0.625rem 1.5rem;
  border-bottom-color: var(--color-primary-hover);
}
.header-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}
.logo-img {
  height: 2.25rem;
  width: auto;
}
.header-nav {
  display: flex;
  gap: 0.25rem;
}
.nav-link {
  position: relative;
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-600);
  text-decoration: none;
  transition: background-color 0.15s, color 0.15s;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 0;
  height: 3px;
  background: var(--color-primary);
  border-radius: 2px;
  box-shadow: 0 0 6px var(--color-glow);
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1), left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 60%;
  left: 20%;
}
.nav-link:hover {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}
.nav-link.router-link-active {
  color: var(--color-primary);
  font-weight: 600;
}
.consumer-main {
  flex: 1;
  padding-top: 5rem;
}
.consumer-footer {
  background-color: var(--color-gray-100);
  border-top: 2px solid var(--color-primary-muted);
  padding: 3rem 1.5rem 2rem;
}
.footer-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
}
.footer-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}
@media (min-width: 768px) {
  .footer-top {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    text-align: left;
  }
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.footer-logo {
  height: 2rem;
  width: auto;
}
.footer-contact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
}
.contact-icon {
  font-size: 1.125rem;
  color: var(--color-primary);
}
.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.footer-links a {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}
.footer-links a:hover {
  color: var(--color-primary);
}
.footer-divider {
  width: 100%;
  height: 1px;
  background-color: var(--color-border);
}
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-active {
  transition-duration: 0.2s;
}
.page-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .header-nav { gap: 0; }
  .nav-link { padding: 0.375rem 0.5rem; font-size: var(--font-size-xs); }
  .logo-img { height: 1.75rem; }
}
</style>
