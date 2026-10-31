<script setup>
defineProps({
  job: Object,
  error: String,
  link: String
})
</script>

<template>
  <div class="estado">
    <span v-if="error" class="error">Error: {{ error }}</span>

    <template v-else-if="!job">Aún no has generado ningún reporte.</template>

    <template v-else-if="job.estado === 'pending' || job.estado === 'processing'">
<<<<<<< HEAD
      Reporte #{{ job.id }} — Estado: <strong>{{ job.estado }}</strong> (prioridad {{ job.prioridad }})
=======
      Reporte #{{ job.id }} — Estado: <strong>{{ job.estado }}</strong>
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
      <span v-if="job.intentos > 0" class="aviso">
        (reintento {{ job.intentos }}: {{ job.error }})
      </span>
      <div v-if="job.estado === 'processing'" class="barra" :title="job.progreso + '%'">
        <div class="barra-relleno" :style="{ width: job.progreso + '%' }"></div>
      </div>
      <small v-if="job.estado === 'processing'">{{ job.progreso }}%</small>
    </template>

    <template v-else-if="job.estado === 'done'">
      Reporte #{{ job.id }} listo ✔<br />
      <a :href="link" target="_blank">Descargar reporte</a>
      <span v-if="job.descarga"> (enlace válido {{ job.descarga.expiraEnMinutos }} minutos)</span>
    </template>

<<<<<<< HEAD
    <span v-else-if="job.estado === 'cancelled'" class="aviso">
      Reporte #{{ job.id }} cancelado.
    </span>

=======
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
    <span v-else-if="job.estado === 'failed'" class="error">
      Reporte #{{ job.id }} falló tras {{ job.intentos }} intento(s): {{ job.error }}
    </span>
  </div>
</template>
