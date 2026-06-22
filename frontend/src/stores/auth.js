import { defineStore } from 'pinia'
import { adminApi } from '../api/admin'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
    token: localStorage.getItem('admin_token') || '',
    isAuthenticated: !!localStorage.getItem('admin_token'),
    loading: false,
    error: null,
  }),
  actions: {
    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        const { data } = await adminApi.login(email.trim(), password)
        this.token = data.data.token
        this.user = data.data.user
        this.isAuthenticated = true
        localStorage.setItem('admin_token', data.data.token)
        localStorage.setItem('admin_user', JSON.stringify(data.data.user))
        if (data.data.refresh_token) {
          localStorage.setItem('admin_refresh_token', data.data.refresh_token)
        }
        return true
      } catch (err) {
        this.error = err.response?.data?.error?.message || 'Login failed. Make sure the backend is running (cd backend && node server.js)'
        return false
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try {
        await adminApi.logout()
      } catch {}
      this.token = ''
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      localStorage.removeItem('admin_refresh_token')
    },
  },
})
