<template>
  <div class="reset-page">
    <main class="reset-shell">
      <section class="reset-form-section">
        <div class="form-container">
          <div class="mobile-brand">
            <img class="mobile-logo" src="/ZANECO_Logo.png" alt="ZANECO" />
            <img class="mobile-logo" src="https://i.imgur.com/SacrqEj.png" alt="DPC" />
          </div>

          <header class="form-header">
            <h2 class="form-heading">Choose New Password</h2>
            <p class="form-subtext">Your reset link is valid. Enter a new password below.</p>
          </header>

          <div v-if="invalidToken" class="token-error">
            <div class="token-error-content">
              <span class="material-symbols-outlined token-error-icon">link_off</span>
              <h3>Invalid or Expired Link</h3>
              <p>This password reset link is invalid or has expired. Please request a new one.</p>
              <router-link to="/admin/forgot-password" class="request-new-btn">Request New Link</router-link>
            </div>
          </div>

          <form v-else class="reset-form" @submit.prevent="handleSubmit" autocomplete="off">
            <div class="field-group">
              <label class="field-label" for="new-password">New Password</label>
              <div class="input-wrap">
                <span class="input-icon material-symbols-outlined">lock</span>
                <input id="new-password" v-model="password" class="form-input-light" :type="passVisible ? 'text' : 'password'" placeholder="Min. 8 characters" autocomplete="new-password" aria-required="true" />
                <button type="button" class="toggle-pass material-symbols-outlined" @click="passVisible = !passVisible">{{ passVisible ? 'visibility_off' : 'visibility' }}</button>
              </div>
              <div class="password-hint" v-if="password && password.length < 8">At least 8 characters required</div>
            </div>

            <div class="field-group">
              <label class="field-label" for="confirm-password">Confirm Password</label>
              <div class="input-wrap">
                <span class="input-icon material-symbols-outlined">lock</span>
                <input id="confirm-password" v-model="confirm" class="form-input-light" :type="passVisible ? 'text' : 'password'" placeholder="Repeat password" autocomplete="new-password" aria-required="true" />
              </div>
              <div class="password-hint" v-if="confirm && password !== confirm">Passwords do not match</div>
            </div>

            <div v-if="error" class="alert-error">{{ error }}</div>
            <div v-if="success" class="alert-success">{{ success }}</div>

            <div class="submit-wrap">
              <button type="submit" class="reset-btn" :disabled="loading || !isValid">
                <span v-if="loading" class="material-symbols-outlined spin">sync</span>
                <span v-else class="material-symbols-outlined">key</span>
                {{ loading ? 'RESETTING...' : 'Reset Password' }}
              </button>
            </div>
          </form>

          <div class="back-row">
            <router-link to="/admin/login" class="back-link">
              <span class="material-symbols-outlined back-icon">arrow_back</span>
              Back to Sign In
            </router-link>
          </div>
        </div>

        <footer class="reset-footer">
          <span class="version-text">v1.0.0</span>
          <div class="footer-links">
            <router-link to="/admin/system-status">System Status</router-link>
          </div>
        </footer>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { adminApi } from '../../api/admin'

const route = useRoute()
const password = ref('')
const confirm = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const passVisible = ref(false)
const invalidToken = ref(false)

const isValid = computed(() => password.value.length >= 8 && password.value === confirm.value)

onMounted(() => {
  if (!route.query.token) {
    invalidToken.value = true
  }
})

async function handleSubmit() {
  if (!isValid.value) return
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    await adminApi.resetPassword(route.query.token, password.value)
    success.value = 'Password reset successfully! Redirecting to login...'
    setTimeout(() => { window.location.href = '/admin/login' }, 2000)
  } catch (err) {
    if (err.response?.status === 400) {
      invalidToken.value = true
    } else {
      error.value = err.response?.data?.error?.message || 'Reset failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-page { width: 100%; min-height: 100vh; background-color: #f8f9ff; color: #121c28; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; }
.reset-shell { width: 100%; max-width: 440px; padding: 2rem 1rem; }
.form-container { width: 100%; display: flex; flex-direction: column; gap: 1.5rem; animation: formIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) both; }
@keyframes formIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.mobile-brand { display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
.mobile-logo { height: 40px; width: auto; object-fit: contain; }
.form-heading { font-family: 'Hanken Grotesk', sans-serif; font-size: 1.75rem; font-weight: 600; color: #121c28; letter-spacing: -0.02em; line-height: 1.1; text-align: center; }
.form-subtext { font-size: 0.875rem; color: #444653; text-align: center; margin-top: 0.25rem; }
.reset-form { display: flex; flex-direction: column; gap: 1.25rem; }
.field-group { display: flex; flex-direction: column; gap: 0.5rem; }
.field-label { font-family: 'Geist', sans-serif; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; color: #757684; }
.input-wrap { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #757684; font-size: 1.25rem; pointer-events: none; }
.input-wrap:focus-within .input-icon { color: var(--color-primary); }
.form-input-light { width: 100%; height: 48px; padding: 0 1rem 0 3rem; background-color: #ffffff; border: 1px solid #d1d5db; color: #121c28; font-size: 1rem; outline: none; transition: all 0.15s; border-radius: var(--radius-md); }
.form-input-light:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(217,119,6,0.15); }
.form-input-light::placeholder { color: #9ca3af; }
.toggle-pass { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); color: #757684; background: none; border: none; cursor: pointer; font-size: 1.25rem; padding: 0; }
.toggle-pass:hover { color: #121c28; }
.password-hint { font-size: 0.75rem; color: #dc2626; margin-top: 0.125rem; }
.alert-error { background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem 1rem; font-size: 0.875rem; border-radius: var(--radius-md); }
.alert-success { background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; padding: 0.75rem 1rem; font-size: 0.875rem; border-radius: var(--radius-md); }
.submit-wrap { padding-top: 0.25rem; }
.reset-btn { width: 100%; height: 48px; background-color: var(--color-primary); color: var(--color-white); font-weight: 700; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.15s; border-radius: var(--radius-md); }
.reset-btn:hover { background-color: var(--color-primary-hover); box-shadow: var(--shadow-md); }
.reset-btn:active { transform: scale(0.98); }
.reset-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
.reset-btn .material-symbols-outlined { font-size: 1.25rem; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
.back-row { text-align: center; }
.back-link { display: inline-flex; align-items: center; gap: 0.375rem; color: var(--color-primary); text-decoration: none; font-size: 0.875rem; font-weight: 500; }
.back-link:hover { text-decoration: underline; }
.back-icon { font-size: 1.125rem; }
.token-error { text-align: center; padding: 2rem 1rem; }
.token-error-content { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
.token-error-icon { font-size: 3rem; color: #dc2626; }
.token-error-content h3 { font-family: 'Hanken Grotesk', sans-serif; font-size: 1.25rem; font-weight: 600; color: #121c28; margin: 0; }
.token-error-content p { font-size: 0.875rem; color: #444653; margin: 0; }
.request-new-btn { display: inline-block; margin-top: 0.5rem; background-color: var(--color-primary); color: var(--color-white); padding: 0.75rem 1.5rem; text-decoration: none; font-weight: 600; font-size: 0.875rem; border-radius: var(--radius-md); }
.request-new-btn:hover { background-color: var(--color-primary-hover); }
.reset-footer { margin-top: 2rem; display: flex; justify-content: space-between; align-items: center; opacity: 0.6; }
.version-text { font-family: 'Geist', sans-serif; font-size: 0.75rem; color: #757684; }
.footer-links { display: flex; gap: 0.75rem; }
.footer-links a { font-family: 'Geist', sans-serif; font-size: 0.75rem; color: #757684; text-decoration: none; }
.footer-links a:hover { color: var(--color-primary); }
</style>
