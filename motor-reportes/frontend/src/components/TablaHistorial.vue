<script setup>
import { urlDescarga } from '../services/api'

defineProps({ reportes: { type: Array, default: () => [] } })
<<<<<<< HEAD
const emit = defineEmits(['cancelar'])
=======
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16

function formatearFecha(texto) {
  return new Date(texto).toLocaleString()
}
</script>

<template>
  <p v-if="reportes.length === 0" class="estado">Aún no hay reportes.</p>

  <div v-else class="tabla-contenedor">
    <table class="tabla">
      <thead>
        <tr>
          <th>#</th>
          <th>Tipo</th>
          <th>Título</th>
<<<<<<< HEAD
          <th>Prioridad</th>
          <th>Estado</th>
          <th>Intentos</th>
          <th>Creado</th>
          <th>Acción</th>
=======
          <th>Estado</th>
          <th>Intentos</th>
          <th>Creado</th>
          <th>Descarga</th>
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in reportes" :key="r.id">
          <td>{{ r.id }}</td>
          <td>{{ r.tipo.toUpperCase() }}</td>
          <td>{{ r.titulo }}</td>
<<<<<<< HEAD
          <td>{{ r.prioridad }}</td>
=======
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
          <td>
            <span class="insignia" :class="r.estado">{{ r.estado }}</span>
            <small v-if="r.estado === 'processing'"> {{ r.progreso }}%</small>
          </td>
          <td>{{ r.intentos }}</td>
          <td>{{ formatearFecha(r.creado_en) }}</td>
          <td>
            <a v-if="r.descarga" :href="urlDescarga(r.descarga.url)" target="_blank">Descargar</a>
<<<<<<< HEAD
            <button v-else-if="r.estado === 'pending'" class="boton-chico" @click="emit('cancelar', r.id)">
              Cancelar
            </button>
=======
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
            <span v-else-if="r.error" class="error" :title="r.error">Ver error</span>
            <span v-else>—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
