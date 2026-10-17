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
      Reporte #{{ job.id }} — Estado: <strong>{{ job.estado }}</strong>...
    </template>

    <template v-else-if="job.estado === 'done'">
      Reporte #{{ job.id }} listo ✔<br />
      <a :href="link" target="_blank">Descargar reporte</a>
      <span v-if="job.descarga"> (enlace válido {{ job.descarga.expiraEnMinutos }} minutos)</span>
    </template>

    <span v-else-if="job.estado === 'failed'" class="error">
      Reporte #{{ job.id }} falló: {{ job.error }}
    </span>
  </div>
</template>
