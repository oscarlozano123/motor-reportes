<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import TablaHistorial from '../components/TablaHistorial.vue'
<<<<<<< HEAD
import { listarReportes, cancelarReporte } from '../services/api'
=======
import { listarReportes } from '../services/api'
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16

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

<<<<<<< HEAD
async function cancelar(id) {
  try {
    await cancelarReporte(id)
  } catch (e) {
    error.value = e.response?.data?.error || e.message
    return
  }
  await cargar()
}

=======
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
onMounted(() => {
  cargar()
  temporizador = setInterval(cargar, 3000) // se refresca solo para ver el avance
})
onBeforeUnmount(() => clearInterval(temporizador))
</script>

<template>
  <section class="panel">
    <h2>Historial de reportes</h2>
<<<<<<< HEAD
    <p class="nota">
      Se actualiza cada 3 segundos. Solo se pueden cancelar los reportes pendientes.
      Los enlaces de descarga expiran a los pocos minutos.
    </p>
    <p v-if="error" class="error">{{ error }}</p>
    <TablaHistorial :reportes="reportes" @cancelar="cancelar" />
=======
    <p class="nota">Se actualiza cada 3 segundos. Los enlaces de descarga expiran a los pocos minutos.</p>
    <p v-if="error" class="error">{{ error }}</p>
    <TablaHistorial :reportes="reportes" />
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
  </section>
</template>
