<script setup>
import { ref } from 'vue'
import { ejecutarLimpieza } from '../services/api'

const minutos = ref('')
const ejecutando = ref(false)
const resultado = ref('')
const error = ref('')

async function limpiar() {
  error.value = ''
  resultado.value = ''
  ejecutando.value = true
  try {
    const r = await ejecutarLimpieza(minutos.value)
    resultado.value =
      `Se eliminaron ${r.eliminados} reporte(s) y ${r.archivosBorrados} archivo(s) ` +
      `(reportes terminados hace más de ${r.minutos} minuto(s)).`
  } catch (e) {
    error.value = e.response?.data?.error || e.message
  } finally {
    ejecutando.value = false
  }
}
</script>

<template>
  <form @submit.prevent="limpiar">
    <label>
      Borrar reportes terminados hace más de (minutos). Déjalo vacío para usar la retención configurada.
      <input v-model="minutos" type="number" min="0" placeholder="Ej: 1" />
    </label>
    <button type="submit" :disabled="ejecutando">
      {{ ejecutando ? 'Limpiando...' : 'Ejecutar limpieza ahora' }}
    </button>
  </form>
  <p v-if="resultado" class="estado">{{ resultado }}</p>
  <p v-if="error" class="error">Error: {{ error }}</p>
</template>
