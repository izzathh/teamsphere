import axios from 'axios'
import useAuthStore from '../store/authStore'
const isAuthRequest = (config) => {
  return config.url?.includes('/auth/login') ||
    config.url?.includes('/auth/register') ||
    config.url?.includes('/auth/refresh')
}

const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const {
    accessToken,
    tenant
  } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  if (tenant?._id) {
    config.headers['X-Tenant-ID'] = tenant._id
  }
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry && !isAuthRequest(original)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve,
              reject
            })
          })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
          .catch((err) => Promise.reject(err))
      }

      original._retry = true
      isRefreshing = true

      const {
        refreshToken,
        setAccessToken,
        logout
      } = useAuthStore.getState()

      try {
        const {
          data
        } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        })
        const newToken = data.accessToken
        setAccessToken(newToken)
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (err) {
        processQueue(err, null)
        logout()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  validate: (data) => api.post('/auth/validate-email', data),
  refresh: (data) => api.post('/auth/refresh', data),
  me: () => api.get('/auth/me'),
}

export const usersAPI = {
  list: (params) => api.get('/users', {
    params
  }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  invite: (data) => api.post('/users/invite', data),
}

export const projectsAPI = {
  list: (params) => api.get('/projects', {
    params
  }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, userId) => api.post(`/projects/${id}/members`, {
    userId
  }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
}

export const tasksAPI = {
  list: (params) => api.get('/tasks', {
    params
  }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, {
    status
  }),
  addComment: (id, comment) => api.post(`/tasks/${id}/comments`, {
    comment
  }),
  delete: (id) => api.delete(`/tasks/${id}`),
}

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
}