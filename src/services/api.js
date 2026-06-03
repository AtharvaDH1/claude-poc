import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009'

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token on every request
api.interceptors.request.use(config => {
  try {
    const stored = sessionStorage.getItem('poc_user')
    if (stored) {
      const user = JSON.parse(stored)
      if (user.access_token && user.access_token !== 'mock-token') {
        config.headers.Authorization = `Bearer ${user.access_token}`
      }
    }
  } catch {}
  return config
})

// Never redirect on 401 — auth is handled at component level
// All errors are silently passed to callers who use .catch(() => {})
api.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
)

export default api
