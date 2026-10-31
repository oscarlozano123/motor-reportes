import { createRouter, createWebHistory } from 'vue-router'
import GenerarView from '../views/GenerarView.vue'
import HistorialView from '../views/HistorialView.vue'
import RecursosView from '../views/RecursosView.vue'

const routes = [
  { path: '/', name: 'generar', component: GenerarView },
  { path: '/historial', name: 'historial', component: HistorialView },
  { path: '/recursos', name: 'recursos', component: RecursosView }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
