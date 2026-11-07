import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { registrarAlNoAutorizado } from './services/api'
import { useAuthStore } from './store/auth'
import './assets/style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia).use(router)

// Si el token vence mientras usas la app, se cierra la sesión y vuelves al login
registrarAlNoAutorizado(() => {
  useAuthStore().salir()
  router.push({ name: 'login' })
})

app.mount('#app')
