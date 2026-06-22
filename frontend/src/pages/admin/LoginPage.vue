<template>
  <div class="login-page">
    <main class="login-shell">
      <!-- Left: Hero Image -->
      <section class="login-hero">
        <div class="hero-bg"></div>
        <div class="hero-overlay"></div>
        <div class="hero-grid"></div>
        <div class="hero-content">
          <div class="hero-brand">
            <img class="hero-logo" src="/ZANECO_Logo.png" alt="ZANECO" />
            <img class="hero-logo" src="https://i.imgur.com/SacrqEj.png" alt="DPC" />
          </div>
          <h1 class="hero-headline">
            Consumer Appointment System: <span class="hero-highlight">Powering Service.</span>
          </h1>
          <p class="hero-desc">The definitive hub for critical utility scheduling, customer service management, and energy distribution coordination across Zamboanga del Norte.</p>
        </div>
      </section>

      <!-- Right: Login Form -->
      <section class="login-form-section">
        <div class="form-container">
          <div class="mobile-brand">
            <img class="mobile-logo" src="/ZANECO_Logo.png" alt="ZANECO" />
            <img class="mobile-logo" src="https://i.imgur.com/SacrqEj.png" alt="DPC" />
          </div>

          <header class="form-header">
            <h2 class="form-heading">Welcome Back</h2>
            <p class="form-subtext">Please enter your administrative credentials to continue.</p>
          </header>

          <form class="login-form" @submit.prevent="handleLogin" autocomplete="off">
            <div class="field-group">
              <label class="field-label" for="login-email">Email or Username</label>
              <div class="input-wrap">
                <span class="input-icon material-symbols-outlined">person</span>
                <input id="login-email" v-model="email" class="form-input-light" type="text" placeholder="admin@zaneco.ph" autocomplete="email" aria-required="true" />
              </div>
            </div>

            <div class="field-group">
              <div class="password-header">
                <label class="field-label" for="login-password">Password</label>
                <a class="forgot-link" href="#">Forgot Password?</a>
              </div>
              <div class="input-wrap">
                <span class="input-icon material-symbols-outlined">lock</span>
                <input id="login-password" v-model="password" class="form-input-light" :type="passVisible ? 'text' : 'password'" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" autocomplete="current-password" aria-required="true" />
                <button type="button" class="toggle-pass material-symbols-outlined" @click="passVisible = !passVisible">{{ passVisible ? 'visibility_off' : 'visibility' }}</button>
              </div>
            </div>

            <div class="remember-row">
              <input id="remember" type="checkbox" v-model="remember" class="custom-checkbox" />
              <label class="remember-label" for="remember">Remember me</label>
            </div>

            <div v-if="error" class="alert-error">{{ error }}</div>

            <div class="submit-wrap">
              <button type="submit" class="signin-btn" :disabled="loading">
                <span v-if="loading" class="material-symbols-outlined spin">sync</span>
                <span v-else class="material-symbols-outlined">login</span>
                {{ loading ? 'AUTHENTICATING...' : 'Sign In' }}
              </button>
            </div>
          </form>

          <div class="security-notice">
            <span class="material-symbols-outlined shield-icon">shield</span>
            <p class="notice-text">
              <span class="notice-bold">Authorized Personnel Only.</span><br />
              This system is monitored. Unauthorized access attempts are logged.
            </p>
          </div>

          <div class="demo-hint">
            <p class="demo-text">Demo: admin@zaneco.ph / admin123</p>
          </div>
        </div>

        <footer class="login-footer">
          <span class="version-text">v1.0.0-PROD</span>
          <div class="footer-links">
            <a href="#">System Status</a>
            <a href="#">Help Desk</a>
          </div>
        </footer>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const remember = ref(false)
const passVisible = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) { error.value = 'Please enter email and password'; return }
  loading.value = true; error.value = ''
  const success = await auth.login(email.value.trim(), password.value)
  if (success) window.location.replace('/admin/dashboard')
  else error.value = auth.error || 'Login failed'
  loading.value = false
}
</script>

<style scoped>
.login-page { width: 100%; min-height: 100vh; background-color: #f8f9ff; color: #121c28; font-family: 'Inter', sans-serif; }
.login-shell { display: flex; min-height: 100vh; width: 100%; flex-direction: column; }
@media (min-width: 768px) { .login-shell { flex-direction: row; } }

/* Hero (Left) */
.login-hero { position: relative; display: none; width: 100%; min-height: 100vh; overflow: hidden; }
@media (min-width: 768px) { .login-hero { display: flex; width: 60%; } }
@media (min-width: 1024px) { .login-hero { width: 66.666%; } }
.hero-bg { position: absolute; inset: 0; z-index: 0; background-image: url('https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1200'); background-size: cover; background-position: center; }
.hero-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(to right, rgba(255,255,255,0.92), rgba(255,255,255,0.1)); }
.hero-grid { position: absolute; inset: 0; z-index: 2; opacity: 0.06; pointer-events: none; background-image: radial-gradient(#d97706 0.5px, transparent 0.5px); background-size: 24px 24px; }
.hero-content { position: relative; z-index: 3; display: flex; flex-direction: column; justify-content: flex-end; padding: 2.5rem; height: 100%; width: 100%; padding-bottom: 6rem; }
.hero-brand { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
.hero-bolt { font-size: 2.25rem; color: var(--color-primary); font-variation-settings: 'FILL' 1; }
.hero-logo { height: 48px; width: auto; object-fit: contain; }
.hero-title { font-family: 'Hanken Grotesk', sans-serif; font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; text-transform: uppercase; color: #121c28; }
.hero-headline { font-family: 'Hanken Grotesk', sans-serif; font-size: 2.5rem; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; color: #121c28; margin-bottom: 0.5rem; max-width: 540px; }
@media (min-width: 1024px) { .hero-headline { font-size: 3rem; } }
.hero-highlight { color: var(--color-primary); }
.hero-desc { font-size: 1rem; line-height: 1.5; color: #444653; max-width: 420px; }

/* Form (Right) */
.login-form-section { display: flex; flex-direction: column; width: 100%; background-color: #f8f9ff; border-left: 1px solid #e5e7eb; align-items: center; justify-content: center; padding: 2rem 1rem 1rem; }
@media (min-width: 768px) { .login-form-section { width: 40%; padding: 2.5rem; } }
@media (min-width: 1024px) { .login-form-section { width: 33.333%; } }
.form-container { width: 100%; max-width: 384px; display: flex; flex-direction: column; gap: 1.5rem; animation: formIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) both; }
@keyframes formIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.mobile-brand { display: flex; align-items: center; gap: 0.5rem; }
@media (min-width: 768px) { .mobile-brand { display: none; } }
.mobile-logo { height: 40px; width: auto; object-fit: contain; }
.mobile-brand-text { font-family: 'Hanken Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #121c28; }
.form-heading { font-family: 'Hanken Grotesk', sans-serif; font-size: 2rem; font-weight: 600; color: #121c28; letter-spacing: -0.02em; line-height: 1.1; }
.form-subtext { font-size: 1rem; color: #444653; margin-top: 0.25rem; }
.login-form { display: flex; flex-direction: column; gap: 1.25rem; }
.field-group { display: flex; flex-direction: column; gap: 0.5rem; }
.field-label { font-family: 'Geist', sans-serif; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; color: #757684; }
.password-header { display: flex; justify-content: space-between; align-items: flex-end; }
.forgot-link { font-family: 'Geist', sans-serif; font-size: 0.75rem; font-weight: 500; color: var(--color-primary); text-decoration: none; }
.forgot-link:hover { text-decoration: underline; }
.input-wrap { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #757684; font-size: 1.25rem; pointer-events: none; transition: color 0.15s; }
.input-wrap:focus-within .input-icon { color: var(--color-primary); }
.form-input-light { width: 100%; height: 48px; padding: 0 1rem 0 3rem; background-color: #ffffff; border: 1px solid #d1d5db; color: #121c28; font-size: 1rem; outline: none; transition: all 0.15s; border-radius: var(--radius-md); }
.form-input-light:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(217,119,6,0.15); }
.form-input-light::placeholder { color: #9ca3af; }
.toggle-pass { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); color: #757684; background: none; border: none; cursor: pointer; font-size: 1.25rem; padding: 0; }
.toggle-pass:hover { color: #121c28; }
.remember-row { display: flex; align-items: center; gap: 0.5rem; }
.custom-checkbox { width: 16px; height: 16px; accent-color: var(--color-primary); cursor: pointer; }
.remember-label { font-size: 1rem; color: #444653; cursor: pointer; user-select: none; }
.alert-error { background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem 1rem; font-size: 0.875rem; border-radius: var(--radius-md); }
.submit-wrap { padding-top: 0.25rem; }
.signin-btn { width: 100%; height: 48px; background-color: var(--color-primary); color: var(--color-white); font-weight: 700; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.15s; border-radius: var(--radius-md); }
.signin-btn:hover { background-color: var(--color-primary-hover); box-shadow: var(--shadow-md); }
.signin-btn:active { transform: scale(0.98); }
.signin-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
.signin-btn .material-symbols-outlined { font-size: 1.25rem; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
.security-notice { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.75rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: var(--radius-md); }
.shield-icon { color: var(--color-primary); font-size: 1.25rem; margin-top: 0.125rem; }
.notice-text { font-family: 'Geist', sans-serif; font-size: 0.75rem; font-weight: 500; color: #444653; line-height: 1.25; }
.notice-bold { color: var(--color-primary); font-weight: 700; }
.demo-hint { text-align: center; }
.demo-text { font-size: 0.75rem; color: #757684; opacity: 0.8; }
.login-footer { margin-top: auto; width: 100%; max-width: 384px; display: flex; justify-content: space-between; align-items: center; opacity: 0.6; padding-top: 1.5rem; }
.version-text { font-family: 'Geist', sans-serif; font-size: 0.75rem; color: #757684; }
.footer-links { display: flex; gap: 0.75rem; }
.footer-links a { font-family: 'Geist', sans-serif; font-size: 0.75rem; color: #757684; text-decoration: none; }
.footer-links a:hover { color: var(--color-primary); }
</style>
