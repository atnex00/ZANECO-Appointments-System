import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const isAdminRequest = error.config?.url?.startsWith('/admin/') || error.config?.headers?.Authorization
      if (isAdminRequest) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
          window.location.href = '/admin/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
