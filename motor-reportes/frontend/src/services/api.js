import axios from 'axios'

// Cambia la URL en frontend/.env (VITE_API_URL) si tu backend corre en otro puerto
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const api = axios.create({ baseURL: API_URL })

export function crearReporte(datos) {
  return api.post('/reportes', datos).then((r) => r.data)
}

export function consultarReporte(id) {
  return api.get(`/reportes/${id}`).then((r) => r.data)
}

export function consultarRecursos() {
  return api.get('/recursos').then((r) => r.data)
}

// El backend devuelve la ruta de descarga con el prefijo /api; se arma la URL completa
export function urlDescarga(rutaDescarga) {
  return `${API_URL}${rutaDescarga.replace('/api', '')}`
}
