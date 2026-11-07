import axios from 'axios'
import { leerToken } from './sesion'

// Cambia la URL en frontend/.env (VITE_API_URL) si tu backend corre en otro puerto
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const api = axios.create({ baseURL: API_URL })

// Cada petición lleva el token de sesión (si hay uno)
api.interceptors.request.use((config) => {
  const token = leerToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el backend responde 401 en una ruta que no es de login, la sesión venció:
// avisamos a quien lo haya registrado (main.js) para que cierre la sesión.
let alNoAutorizado = () => {}
export function registrarAlNoAutorizado(fn) {
  alNoAutorizado = fn
}
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const url = error.config?.url || ''
    if (error.response?.status === 401 && !url.startsWith('/auth/')) alNoAutorizado()
    return Promise.reject(error)
  }
)

// --- Autenticación ---
export function registrarUsuario(datos) {
  return api.post('/auth/registro', datos).then((r) => r.data)
}

export function iniciarSesion(datos) {
  return api.post('/auth/login', datos).then((r) => r.data)
}

export function quienSoy() {
  return api.get('/auth/yo').then((r) => r.data)
}

// --- Ventas (datos reales para los reportes) ---
export function categoriasVentas() {
  return api.get('/ventas/categorias').then((r) => r.data)
}

export function resumenVentas(filtros) {
  const params = {}
  if (filtros.desde) params.desde = filtros.desde
  if (filtros.hasta) params.hasta = filtros.hasta
  if (filtros.categoria) params.categoria = filtros.categoria
  return api.get('/ventas/resumen', { params }).then((r) => r.data)
}

export function crearReporte(datos) {
  return api.post('/reportes', datos).then((r) => r.data)
}

export function consultarReporte(id) {
  return api.get(`/reportes/${id}`).then((r) => r.data)
}

// Historial: los reportes más recientes primero
export function listarReportes(limite = 50) {
  return api.get('/reportes', { params: { limite } }).then((r) => r.data)
}

// Cancela un reporte que todavía está pendiente
export function cancelarReporte(id) {
  return api.post(`/reportes/${id}/cancelar`).then((r) => r.data)
}

export function consultarRecursos() {
  return api.get('/recursos').then((r) => r.data)
}

// Últimas lecturas de CPU/RAM para la gráfica
export function historialRecursos() {
  return api.get('/recursos/historial').then((r) => r.data)
}

// Ejecuta la recolección de basura en el backend. Si se pasa "minutos", borra los
// reportes terminados hace más de esos minutos; si no, usa la retención del .env.
export function ejecutarLimpieza(minutos) {
  const params = minutos === undefined || minutos === '' ? {} : { minutos }
  return api.post('/mantenimiento/limpieza', null, { params }).then((r) => r.data)
}

// El backend devuelve la ruta de descarga con el prefijo /api; se arma la URL completa
export function urlDescarga(rutaDescarga) {
  return `${API_URL}${rutaDescarga.replace('/api', '')}`
}
