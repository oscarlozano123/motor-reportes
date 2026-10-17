import { defineStore } from 'pinia'
import { crearReporte, consultarReporte, urlDescarga } from '../services/api'

let intervalo = null

export const useReportesStore = defineStore('reportes', {
  state: () => ({
    job: null,
    enviando: false,
    error: ''
  }),
  getters: {
    enCurso: (state) =>
      !!state.job && ['pending', 'processing'].includes(state.job.estado),
    linkDescarga: (state) =>
      state.job?.descarga ? urlDescarga(state.job.descarga.url) : null
  },
  actions: {
    async generar(datos) {
      this.error = ''
      this.enviando = true
      this.detenerConsulta()
      try {
        this.job = await crearReporte({
          ...datos,
          columnas: ['Columna A', 'Columna B', 'Columna C']
        })
        this.iniciarConsulta()
      } catch (e) {
        this.job = null
        this.error = e.response?.data?.error || e.message || 'Error al encolar el reporte'
      } finally {
        this.enviando = false
      }
    },
    iniciarConsulta() {
      intervalo = setInterval(() => this.actualizar(), 2000)
    },
    detenerConsulta() {
      if (intervalo) clearInterval(intervalo)
      intervalo = null
    },
    async actualizar() {
      if (!this.job) return
      try {
        this.job = await consultarReporte(this.job.id)
        if (!['pending', 'processing'].includes(this.job.estado)) {
          this.detenerConsulta()
        }
      } catch (e) {
        console.error('Error consultando estado:', e)
      }
    }
  }
})
