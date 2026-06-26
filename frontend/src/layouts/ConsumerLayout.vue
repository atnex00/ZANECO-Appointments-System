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
        <div class="footer-brand">
          <img src="/ZANECO_Logo.png" alt="ZANECO" class="footer-logo" />
          <img src="https://i.imgur.com/SacrqEj.png" alt="DPC" class="footer-logo" />
          <span class="text-sm text-muted">Zamboanga del Norte Electric Cooperative</span>
        </div>
        <div class="footer-links">
          <a href="https://zaneco.ph/company-profile/" target="_blank" rel="noopener">About Us</a>
          <a href="https://zaneco.ph/contact-us/" target="_blank" rel="noopener">Contact Center</a>
          <a href="https://www.facebook.com/p/Zaneco-Inc-61551218819204/" target="_blank" rel="noopener">Service Updates</a>
          <router-link to="/terms">Terms of Service</router-link>
          <router-link to="/security">Security</router-link>
        </div>
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
  border-bottom: 1px solid transparent;
}
.consumer-header.scrolled {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow-md);
  padding: 0.625rem 1.5rem;
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
  height: 2px;
  background: var(--color-primary);
  border-radius: 1px;
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
.admin-link {
  border: 1px solid var(--color-border);
  margin-left: 0.5rem;
}
.consumer-main {
  flex: 1;
  padding-top: 5rem;
}
.consumer-footer {
  background-color: var(--color-gray-50);
  border-top: 1px solid var(--color-border);
  padding: 2.5rem 1.5rem;
}
.footer-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.75rem;
}
.footer-logo {
  height: 2rem;
  width: auto;
}
.footer-links {
  display: flex;
  gap: 1.5rem;
}
.footer-links a {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}
.footer-links a:hover {
  color: var(--color-primary);
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
