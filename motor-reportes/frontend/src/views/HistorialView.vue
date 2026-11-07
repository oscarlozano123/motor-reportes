<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import TablaHistorial from '../components/TablaHistorial.vue'
import { listarReportes, cancelarReporte } from '../services/api'

const reportes = ref([])
const error = ref('')
let temporizador = null

async function cargar() {
  try {
    reportes.value = await listarReportes()
    error.value = ''
  } catch {
    error.value = 'No se pudo conectar con el backend.'
  }
}

async function cancelar(id) {
  try {
    await cancelarReporte(id)
  } catch (e) {
    error.value = e.response?.data?.error || e.message
    return
  }
  await cargar()
}

onMounted(() => {
  cargar()
  temporizador = setInterval(cargar, 3000) // se refresca solo para ver el avance
})
onBeforeUnmount(() => clearInterval(temporizador))
</script>

<template>
  <section class="panel">
    <h2>Historial de reportes</h2>
    <p class="nota">
      Se actualiza cada 3 segundos. Solo se pueden cancelar los reportes pendientes.
      Los enlaces de descarga expiran a los pocos minutos.
    </p>
    <p v-if="error" class="error">{{ error }}</p>
    <TablaHistorial :reportes="reportes" @cancelar="cancelar" />
  </section>
</template>
