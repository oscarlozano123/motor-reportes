import { createRouter, createWebHistory } from 'vue-router'
import GenerarView from '../views/GenerarView.vue'
import HistorialView from '../views/HistorialView.vue'
import RecursosView from '../views/RecursosView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../store/auth'

const routes = [
  { path: '/login', name: 'login', component: LoginView },
  { path: '/', name: 'generar', component: GenerarView, meta: { requiereSesion: true } },
  { path: '/historial', name: 'historial', component: HistorialView, meta: { requiereSesion: true } },
  { path: '/recursos', name: 'recursos', component: RecursosView, meta: { requiereSesion: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guardia: sin sesión solo se puede entrar a /login; con sesión, /login lleva al inicio
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.listo) await auth.restaurar()

  if (to.meta.requiereSesion && !auth.haySesion) return { name: 'login' }
  if (to.name === 'login' && auth.haySesion) return { name: 'generar' }
})

export default router
