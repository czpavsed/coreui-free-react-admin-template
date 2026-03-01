import axios from 'axios'
import { auth } from '../firebaseConfig'

function normalizeApiBaseUrl(raw) {
  const fallback = '/api/'
  const base = String(raw || fallback).trim() || fallback
  return base.endsWith('/') ? base : `${base}/`
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_API_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use(async (config) => {
  if (config.skipAuth) return config

  const user = auth.currentUser
  if (!user) {
    throw new Error('Uživatel není přihlášen (Firebase). Nelze volat API bez tokenu.')
  }

  const token = await user.getIdToken(false)

  config.headers = config.headers || {}
  config.headers.Authorization = `Bearer ${token}`

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config
    const status = error?.response?.status

    if (!original || original.__retriedWithRefresh) {
      return Promise.reject(error)
    }

    if (status !== 401 && status !== 403) {
      return Promise.reject(error)
    }

    try {
      original.__retriedWithRefresh = true


      const user = auth.currentUser
      if (!user) return Promise.reject(error)

      const token = await user.getIdToken(true)
      original.headers = original.headers || {}
      original.headers.Authorization = `Bearer ${token}`

      return api.request(original)
    } catch {
      return Promise.reject(error)
    }
  }
)

export default api
export { API_BASE_URL }
