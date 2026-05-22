import axios from 'axios'

// Caminho relativo → o proxy do Vite encaminha para o backend (funciona local e em rede)
// Para produção, defina VITE_API_URL no .env
const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s — evita loading infinito se o backend não responder
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      console.warn('[Axios] 401 Unauthorized interceptado da rota:', error.config?.url)
      // Dispara evento global para o AuthContext interceptar e abrir o Modal de Soft-Login
      window.dispatchEvent(new CustomEvent('auth-unauthorized'))
    }
    return Promise.reject(error)
  },
)

export default api
