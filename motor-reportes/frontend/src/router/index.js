import { createRouter, createWebHistory } from 'vue-router'
import GenerarView from '../views/GenerarView.vue'
import RecursosView from '../views/RecursosView.vue'

const routes = [
  { path: '/', name: 'generar', component: GenerarView },
  { path: '/recursos', name: 'recursos', component: RecursosView }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
