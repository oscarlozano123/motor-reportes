<script setup>
import PanelRecursos from '../components/PanelRecursos.vue'
<<<<<<< HEAD
import GraficaRecursos from '../components/GraficaRecursos.vue'
=======
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
import PanelLimpieza from '../components/PanelLimpieza.vue'
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

  <section class="panel">
<<<<<<< HEAD
    <h2>Uso de CPU y RAM en vivo</h2>
    <GraficaRecursos />
  </section>

  <section class="panel">
=======
>>>>>>> afe6d997551c214bf6f2f550e5fdbf4f4a05cd16
    <h2>Limpieza de reportes (garbage collection)</h2>
    <p class="nota">
      Cada hora el backend borra automáticamente los reportes viejos y sus archivos.
      Aquí puedes ejecutarla ahora mismo.
    </p>
    <PanelLimpieza />
  </section>
</template>
