import { defineStore } from 'pinia'
import {
  registrarUsuario, iniciarSesion, quienSoy
} from '../services/api'
import { leerToken, guardarToken, borrarToken } from '../services/sesion'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    usuario: null,
    // true cuando ya intentamos restaurar la sesión al abrir la página
    listo: false
  }),
  getters: {
    haySesion: (state) => !!state.usuario
  },
  actions: {
    // Al abrir la página: si hay token guardado, comprobamos que siga siendo válido
    async restaurar() {
      if (leerToken()) {
        try {
          this.usuario = await quienSoy()
        } catch {
          borrarToken()
          this.usuario = null
        }
      }
      this.listo = true
    },
    async ingresar(email, password) {
      const r = await iniciarSesion({ email, password })
      guardarToken(r.token)
      this.usuario = r.usuario
    },
    async crearCuenta(nombre, email, password) {
      const r = await registrarUsuario({ nombre, email, password })
      guardarToken(r.token)
      this.usuario = r.usuario
    },
    salir() {
      borrarToken()
      this.usuario = null
    }
  }
})
