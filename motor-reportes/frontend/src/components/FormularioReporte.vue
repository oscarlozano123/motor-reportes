<script setup>
import { reactive } from 'vue'

defineProps({ enviando: Boolean })
const emit = defineEmits(['enviar'])

const form = reactive({ tipo: 'pdf', titulo: '', filas: 500 })

function enviar() {
  emit('enviar', { tipo: form.tipo, titulo: form.titulo, filas: Number(form.filas) })
}
</script>

<template>
  <form @submit.prevent="enviar">
    <label>
      Tipo de reporte
      <select v-model="form.tipo" required>
        <option value="pdf">PDF</option>
        <option value="excel">Excel</option>
      </select>
    </label>

    <label>
      Título
      <input v-model="form.titulo" type="text" placeholder="Reporte de ventas" required />
    </label>

    <label>
      Cantidad de filas (simula un reporte denso)
      <input v-model="form.filas" type="number" min="1" max="20000" required />
    </label>

    <button type="submit" :disabled="enviando">
      {{ enviando ? 'Enviando...' : 'Generar reporte' }}
    </button>
  </form>
</template>
