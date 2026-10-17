<script setup>
import PanelRecursos from '../components/PanelRecursos.vue'
</script>

<template>
  <section class="panel">
    <h2>Recursos del servidor</h2>
    <p class="nota">
      Se actualiza cada 4 segundos. El worker no toma trabajos nuevos si la CPU o la RAM
      superan el umbral configurado en el backend.
    </p>
    <PanelRecursos />
  </section>
</template>
