<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { consultarRecursos } from '../services/api'

const datos = ref(null)
const error = ref(false)
let temporizador = null

async function cargar() {
  try {
    datos.value = await consultarRecursos()
    error.value = false
  } catch {
    error.value = true
  }
}

onMounted(() => {
  cargar()
  temporizador = setInterval(cargar, 4000)
})
onBeforeUnmount(() => clearInterval(temporizador))
</script>

<template>
  <div class="estado">
    <span v-if="error" class="error">No se pudo conectar con el backend.</span>
    <template v-else-if="datos">
      CPU: <strong>{{ datos.cpuPct }}%</strong> &nbsp;|&nbsp;
      RAM: <strong>{{ datos.ramPct }}%</strong> &nbsp;|&nbsp;
      Núcleos: {{ datos.nucleos }}
    </template>
    <template v-else>Cargando...</template>
  </div>
</template>
