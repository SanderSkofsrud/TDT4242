import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

let authToken: string | null = null
let unauthorisedHandler: (() => void) | null = null

export function setAuthToken(token: string | null): void {
  authToken = token
}

export function registerUnauthorisedHandler(handler: () => void): void {
  unauthorisedHandler = handler
}

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (unauthorisedHandler) {
        unauthorisedHandler()
      }
    }
    return Promise.reject(error)
  },
)

export default api

