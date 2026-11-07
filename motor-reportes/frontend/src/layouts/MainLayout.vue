<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { useReportesStore } from '../store/reportes'

// Layout: estructura común de todas las vistas (encabezado + contenido)
const auth = useAuthStore()
const reportes = useReportesStore()
const router = useRouter()

function salir() {
  reportes.detenerConsulta()
  reportes.job = null
  auth.salir()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="encabezado">
    <h1>Motor de Reportes Asíncronos</h1>

    <nav v-if="auth.haySesion" class="menu">
      <router-link to="/">Generar reporte</router-link>
      <router-link to="/historial">Historial</router-link>
      <router-link to="/recursos">Recursos y limpieza</router-link>
    </nav>

    <div v-if="auth.haySesion" class="sesion">
      <span>👤 {{ auth.usuario.nombre }}</span>
      <button class="boton-chico" @click="salir">Salir</button>
    </div>
  </header>

  <main class="contenido">
    <slot />
  </main>
</template>
