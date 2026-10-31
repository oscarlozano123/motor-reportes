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
      <div class="medidor" title="CPU">
        <div class="medidor-relleno" :class="{ alto: datos.cpuPct >= datos.umbralCpu }"
             :style="{ width: datos.cpuPct + '%' }"></div>
      </div>
      <div class="medidor" title="RAM">
        <div class="medidor-relleno" :class="{ alto: datos.ramPct >= datos.umbralRam }"
             :style="{ width: datos.ramPct + '%' }"></div>
      </div>
      <small v-if="datos.umbralCpu">
        El worker no toma trabajos nuevos si la CPU supera {{ datos.umbralCpu }}% o la RAM {{ datos.umbralRam }}%.
      </small>
    </template>
    <template v-else>Cargando...</template>
  </div>
</template>
