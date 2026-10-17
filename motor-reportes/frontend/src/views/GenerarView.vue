<script setup>
import { onBeforeUnmount } from 'vue'
import FormularioReporte from '../components/FormularioReporte.vue'
import EstadoReporte from '../components/EstadoReporte.vue'
import PanelRecursos from '../components/PanelRecursos.vue'
import { useReportesStore } from '../store/reportes'

const store = useReportesStore()
onBeforeUnmount(() => store.detenerConsulta())
</script>

<template>
  <section class="panel">
    <h2>Generar nuevo reporte</h2>
    <FormularioReporte :enviando="store.enviando" @enviar="store.generar" />
  </section>

  <section class="panel">
    <h2>Estado del reporte</h2>
    <EstadoReporte :job="store.job" :error="store.error" :link="store.linkDescarga" />
  </section>

  <section class="panel">
    <h2>Recursos del servidor</h2>
    <PanelRecursos />
  </section>
</template>
